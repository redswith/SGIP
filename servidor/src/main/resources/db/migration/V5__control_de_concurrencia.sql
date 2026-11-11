-- Detecta escrituras simultáneas sin alterar los datos existentes.
ALTER TABLE incidencias ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE problemas ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE errores_conocidos ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE elementos_configuracion ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE categorias ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
