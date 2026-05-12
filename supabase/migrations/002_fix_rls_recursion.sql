-- Corrige recursão nas políticas RLS de profiles
-- O problema: políticas SELECT faziam subquery em profiles com RLS ativa,
-- causando recursão infinita que retornava vazio sem erro.

DROP POLICY IF EXISTS "Trainer lê todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Aluno lê o próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Trainer atualiza qualquer perfil" ON profiles;
DROP POLICY IF EXISTS "Aluno atualiza o próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Somente trainer atualiza" ON app_settings;

-- Função auxiliar com SECURITY DEFINER (ignora RLS internamente)
CREATE OR REPLACE FUNCTION is_trainer()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'trainer'
  );
$$;

-- SELECT: qualquer autenticado lê perfis (app fechado, aceitável)
CREATE POLICY "Autenticado lê perfis" ON profiles
  FOR SELECT TO authenticated USING (true);

-- UPDATE: trainer atualiza qualquer perfil
CREATE POLICY "Trainer atualiza qualquer perfil" ON profiles
  FOR UPDATE TO authenticated USING (is_trainer());

-- UPDATE: aluno atualiza só o próprio perfil
CREATE POLICY "Aluno atualiza o próprio perfil" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id AND NOT is_trainer());

-- app_settings: só trainer atualiza
CREATE POLICY "Somente trainer atualiza" ON app_settings
  FOR UPDATE TO authenticated USING (is_trainer());
