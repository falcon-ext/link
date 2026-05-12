-- ─────────────────────────────────────────
-- FASE 1.2 — Tabelas base + RLS
-- PowerLink App
-- ─────────────────────────────────────────

-- APP SETTINGS (linha única — configurações globais do app)
CREATE TABLE app_settings (
  id           int PRIMARY KEY DEFAULT 1,
  access_code  text NOT NULL DEFAULT 'powerlink2024',
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO app_settings (id, access_code) VALUES (1, 'powerlink2024');

-- PROFILES (um registro por usuário autenticado)
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('trainer', 'student')),
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text,
  birth_date   date,
  goal         text,
  avatar_url   text,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- APP SETTINGS
-- Qualquer usuário autenticado pode ler (aluno precisa para validar o código no cadastro)
CREATE POLICY "Leitura pública autenticada" ON app_settings
  FOR SELECT TO authenticated USING (true);

-- Somente o trainer pode atualizar
CREATE POLICY "Somente trainer atualiza" ON app_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
    )
  );

-- PROFILES — leitura
-- Trainer lê todos os perfis
CREATE POLICY "Trainer lê todos os perfis" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'trainer'
    )
  );

-- Aluno lê apenas o próprio perfil
CREATE POLICY "Aluno lê o próprio perfil" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- PROFILES — insert (criação do perfil após signup)
CREATE POLICY "Usuário cria o próprio perfil" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- PROFILES — update
-- Trainer atualiza qualquer perfil
CREATE POLICY "Trainer atualiza qualquer perfil" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'trainer'
    )
  );

-- Aluno atualiza apenas o próprio perfil
CREATE POLICY "Aluno atualiza o próprio perfil" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);
