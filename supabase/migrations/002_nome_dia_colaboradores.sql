-- Adiciona nome descritivo ao dia de evento (ex: "Palestra sobre assédio")
ALTER TABLE dias_de_evento ADD COLUMN nome TEXT;

-- Colaboradores autorizados a registrar presença
CREATE TABLE colaboradores_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE colaboradores_autorizados ENABLE ROW LEVEL SECURITY;

-- Organizadores gerenciam a lista
CREATE POLICY "colaboradores_gestao_organizador" ON colaboradores_autorizados
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM participantes WHERE id = auth.uid() AND role = 'organizador'))
  WITH CHECK (EXISTS (SELECT 1 FROM participantes WHERE id = auth.uid() AND role = 'organizador'));
