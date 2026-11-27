create or replace function public.confirmar_cita_perruqueria(
  p_reserva uuid,
  p_client uuid,
  p_servei uuid,
  p_dia date,
  p_torn text,
  p_tasques jsonb
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  tasca record;
  cita_existent public.citas%rowtype;
  tasques_existents jsonb;
  hora_inici timestamp;
  hora_fi timestamp;
  fi_anterior integer;
  ordre_anterior integer;
  id_cita_tasca uuid;
  te_tasca_assignada boolean := false;
  dia_setmana integer := extract(dow from p_dia);
  es_exposicio boolean;
  estats_cancelats constant text[] := array['cancelada', 'cancelado', 'anulada', 'anulado'];
begin
  if p_reserva is null or p_client is null or p_servei is null or p_dia is null
    or p_torn is null or p_torn not in ('mati', 'tarda', 'indiferent')
    or jsonb_typeof(p_tasques) is distinct from 'array' then
    raise exception 'Falten dades de la reserva.';
  end if;

  -- Serialitza les confirmacions del mateix dia abans de tornar a mirar els solapaments.
  perform pg_advisory_xact_lock(hashtextextended('perruqueria:cites:' || p_dia::text, 0));

  select * into cita_existent from public.citas where id = p_reserva;
  if found then
    select jsonb_agg(jsonb_build_object(
      'tarea_id', t.tarea_id,
      'empleado_id', e.empleado_id,
      'inici', (extract(epoch from (t.fecha_inicio - p_dia::timestamp)) / 60)::integer,
      'fi', (extract(epoch from (t.fecha_fin - p_dia::timestamp)) / 60)::integer
    ) order by t.fecha_inicio) into tasques_existents
    from public.cita_tareas t
    left join public.cita_tareas_empleados e on e.cita_tarea_id = t.id
    where t.cita_id = p_reserva and t.servicio_id = p_servei;

    if cita_existent.cliente_id = p_client and cita_existent.dia::date = p_dia
      and tasques_existents = p_tasques then
      return p_reserva;
    end if;
    raise exception 'Aquesta reserva ja s’ha confirmat amb altres dades.';
  end if;

  if not exists (select 1 from public.servicios where id = p_servei and activo)
    or jsonb_array_length(p_tasques) = 0
    or jsonb_array_length(p_tasques) <> (select count(*) from public.tareas where servicio_id = p_servei) then
    raise exception 'El catàleg del servei ha canviat. Torna a configurar la cita.';
  end if;

  for tasca in
    select f.*, t.orden, t.nombre
    from jsonb_array_elements(p_tasques) with ordinality entrada(valor, posicio)
    cross join lateral jsonb_to_record(entrada.valor) as f(tarea_id uuid, empleado_id uuid, inici integer, fi integer)
    left join public.tareas t on t.id = f.tarea_id and t.servicio_id = p_servei
    order by entrada.posicio
  loop
    if tasca.orden is null or tasca.inici is null or tasca.fi is null
      or tasca.inici < 0 or tasca.fi > 1440 or tasca.fi <= tasca.inici
      or (fi_anterior is not null and (tasca.inici <> fi_anterior or tasca.orden <= ordre_anterior)) then
      raise exception 'Comprova l’ordre i la durada de les tasques.';
    end if;

    es_exposicio := tasca.nombre ~* '^exposici[oó]n?([[:space:]]|$)';
    if es_exposicio and tasca.empleado_id is not null then
      raise exception 'Una tasca d’exposició no necessita cap treballadora assignada.';
    end if;

    if not es_exposicio then
      te_tasca_assignada := true;
      hora_inici := p_dia::timestamp + make_interval(mins => tasca.inici);
      hora_fi := p_dia::timestamp + make_interval(mins => tasca.fi);

      if not exists (
        select 1 from public.empleado_tareas et
        join public.empleados e on e.id = et.empleado_id and e.activo and e.fecha_baja is null
        where et.tarea_id = tasca.tarea_id and e.id = tasca.empleado_id
      ) or not exists (
        select 1 from public.horarios_empleados h
        where h.empleado_id = tasca.empleado_id and h.dia_semana % 7 = dia_setmana
          and ((p_torn <> 'tarda' and hora_inici >= p_dia + h.hora_inicio_manana and hora_fi <= p_dia + h.hora_fin_manana)
            or (p_torn <> 'mati' and hora_inici >= p_dia + h.hora_inicio_tarde and hora_fi <= p_dia + h.hora_fin_tarde))
      ) or exists (
        select 1 from public.ausencias_empleados a
        where a.empleado_id = tasca.empleado_id and a.fecha_inicio < hora_fi
          and (a.fecha_fin is null or a.fecha_fin > hora_inici)
      ) or exists (
        select 1 from public.cita_tareas_empleados e
        join public.cita_tareas t on t.id = e.cita_tarea_id
        join public.citas c on c.id = t.cita_id
        where e.empleado_id = tasca.empleado_id and t.fecha_inicio < hora_fi and t.fecha_fin > hora_inici
          and lower(trim(coalesce(t.estado, ''))) <> all(estats_cancelats)
          and lower(trim(coalesce(c.estado, ''))) <> all(estats_cancelats)
      ) then
        raise exception 'L’hora ja no està disponible. Torna al calendari i tria una altra franja.';
      end if;
    end if;

    fi_anterior := tasca.fi;
    ordre_anterior := tasca.orden;
  end loop;

  if not te_tasca_assignada then
    raise exception 'El servei ha d’incloure almenys una tasca amb una treballadora assignada.';
  end if;

  insert into public.citas (id, cliente_id, estado, dia)
  values (p_reserva, p_client, 'confirmada', p_dia::timestamp);

  insert into public.cita_servicios (cita_id, servicio_id) values (p_reserva, p_servei);

  for tasca in select * from jsonb_to_recordset(p_tasques) as f(tarea_id uuid, empleado_id uuid, inici integer, fi integer)
  loop
    id_cita_tasca := gen_random_uuid();
    insert into public.cita_tareas (id, cita_id, servicio_id, tarea_id, fecha_inicio, fecha_fin, estado)
    values (id_cita_tasca, p_reserva, p_servei, tasca.tarea_id,
      p_dia::timestamp + make_interval(mins => tasca.inici),
      p_dia::timestamp + make_interval(mins => tasca.fi), 'confirmada');

    if tasca.empleado_id is not null then
      insert into public.cita_tareas_empleados (cita_tarea_id, empleado_id) values (id_cita_tasca, tasca.empleado_id);
    end if;
  end loop;

  return p_reserva;
end;
$$;

revoke execute on function public.confirmar_cita_perruqueria(uuid, uuid, uuid, date, text, jsonb) from public;
grant execute on function public.confirmar_cita_perruqueria(uuid, uuid, uuid, date, text, jsonb) to anon, authenticated;
