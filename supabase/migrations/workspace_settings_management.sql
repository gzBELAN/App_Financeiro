-- App Financeiro — configurações, múltiplos controles e gestão de participantes.
-- Execute uma única vez no SQL Editor do Supabase, após shared_financial_workspaces.sql.

begin;

-- Funções SECURITY DEFINER mantêm regras de autorização críticas no banco.
create or replace function public.create_financial_workspace(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_workspace_id uuid; v_name text := trim(p_name);
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if char_length(v_name) not between 1 and 100 then raise exception 'Workspace name must have between 1 and 100 characters'; end if;
  insert into public.financial_workspaces (name, owner_profile_id)
  values (v_name, auth.uid()) returning id into v_workspace_id;
  insert into public.workspace_members (workspace_id, profile_id, role)
  values (v_workspace_id, auth.uid(), 'owner');
  return v_workspace_id;
end;
$$;

create or replace function public.update_workspace_member_role(p_workspace_id uuid, p_profile_id uuid, p_role public.workspace_member_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only an owner can manage participants'; end if;
  if p_profile_id = auth.uid() then raise exception 'Use ownership transfer instead of changing your own role'; end if;
  if p_role = 'owner' then raise exception 'Use ownership transfer to assign an owner'; end if;
  update public.workspace_members set role = p_role
  where workspace_id = p_workspace_id and profile_id = p_profile_id;
  if not found then raise exception 'Participant not found'; end if;
end;
$$;

create or replace function public.remove_workspace_member(p_workspace_id uuid, p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only an owner can remove participants'; end if;
  if p_profile_id = auth.uid() then raise exception 'The owner cannot remove themselves'; end if;
  delete from public.workspace_members where workspace_id = p_workspace_id and profile_id = p_profile_id;
  if not found then raise exception 'Participant not found'; end if;
end;
$$;

create or replace function public.transfer_workspace_ownership(p_workspace_id uuid, p_new_owner_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only an owner can transfer ownership'; end if;
  if p_new_owner_id = auth.uid() then raise exception 'Choose another participant'; end if;
  if not exists (select 1 from public.workspace_members where workspace_id = p_workspace_id and profile_id = p_new_owner_id) then raise exception 'New owner must already be a participant'; end if;
  update public.workspace_members set role = 'editor' where workspace_id = p_workspace_id and profile_id = auth.uid();
  update public.workspace_members set role = 'owner' where workspace_id = p_workspace_id and profile_id = p_new_owner_id;
  update public.financial_workspaces set owner_profile_id = p_new_owner_id where id = p_workspace_id;
end;
$$;

create or replace function public.delete_financial_workspace(p_workspace_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_workspace_owner(p_workspace_id) then raise exception 'Only an owner can delete a financial workspace'; end if;
  delete from public.financial_workspaces where id = p_workspace_id;
end;
$$;

-- Limpa dados de propriedade antes da exclusão definitiva da conta via API protegida.
create or replace function public.delete_my_account_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if exists (
    select 1
    from public.financial_workspaces w
    where w.owner_profile_id = auth.uid()
      and exists (
        select 1 from public.workspace_members m
        where m.workspace_id = w.id and m.profile_id <> auth.uid()
      )
  ) then
    raise exception 'Transfer ownership or delete shared workspaces before deleting the account';
  end if;
  delete from public.financial_workspaces where owner_profile_id = auth.uid();
  delete from public.profiles where id = auth.uid();
end;
$$;

commit;
