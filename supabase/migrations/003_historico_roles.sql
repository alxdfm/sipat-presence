-- Histórico de alterações de role de participantes
CREATE TABLE historico_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  role_anterior TEXT NOT NULL CHECK (role_anterior IN ('participante', 'organizador')),
  role_novo TEXT NOT NULL CHECK (role_novo IN ('participante', 'organizador')),
  alterado_por_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  alterado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE historico_roles ENABLE ROW LEVEL SECURITY;

-- Organizadores podem ler todo o histórico; service_role insere (sem política necessária)
CREATE POLICY "historico_roles_leitura_organizador" ON historico_roles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM participantes WHERE id = auth.uid() AND role = 'organizador'));
