-- Participantes (espelha auth.users do Supabase)
CREATE TABLE participantes (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT,
  role TEXT NOT NULL DEFAULT 'participante' CHECK (role IN ('participante', 'organizador')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para criar participante automaticamente ao fazer login
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO participantes (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Eventos
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dias de evento
CREATE TABLE dias_de_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_abertura TIME NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 60,
  codigo_do_dia TEXT DEFAULT NULL, -- NULL até o Organizador ativar
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Presenças
CREATE TABLE presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  dia_de_evento_id UUID NOT NULL REFERENCES dias_de_evento(id) ON DELETE CASCADE,
  registrada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participante_id, dia_de_evento_id)
);

-- RLS Policies
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_de_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;

-- Participantes: cada um vê/edita apenas o próprio registro
CREATE POLICY "participante_ve_proprio" ON participantes
  FOR SELECT USING (auth.uid() = id);

-- Eventos: todos autenticados podem ver
CREATE POLICY "eventos_leitura_publica" ON eventos
  FOR SELECT TO authenticated USING (true);

-- Eventos: apenas organizadores podem criar/editar
CREATE POLICY "eventos_escrita_organizador" ON eventos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM participantes WHERE id = auth.uid() AND role = 'organizador'))
  WITH CHECK (EXISTS (SELECT 1 FROM participantes WHERE id = auth.uid() AND role = 'organizador'));

-- Dias de evento: todos autenticados podem ver
CREATE POLICY "dias_leitura_publica" ON dias_de_evento
  FOR SELECT TO authenticated USING (true);

-- Dias de evento: apenas organizadores podem criar/editar
CREATE POLICY "dias_escrita_organizador" ON dias_de_evento
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM participantes WHERE id = auth.uid() AND role = 'organizador'))
  WITH CHECK (EXISTS (SELECT 1 FROM participantes WHERE id = auth.uid() AND role = 'organizador'));

-- Presenças: participante vê as próprias
CREATE POLICY "presencas_leitura_propria" ON presencas
  FOR SELECT TO authenticated USING (participante_id = auth.uid());

-- Presenças: inserção via service_role apenas (API Route server-side)
CREATE POLICY "presencas_insercao_service" ON presencas
  FOR INSERT TO service_role WITH CHECK (true);
