GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_game_views(uuid) TO anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_first_admin ON auth.users;
CREATE TRIGGER on_auth_user_first_admin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.auto_grant_first_admin();