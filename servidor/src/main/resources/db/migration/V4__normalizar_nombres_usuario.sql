-- Conserva contraseñas y permisos; elimina espacios accidentales del identificador.
DO $$
BEGIN
  IF EXISTS (
    SELECT btrim(nombre_usuario, E' \t\r\n') FROM usuarios
    GROUP BY btrim(nombre_usuario, E' \t\r\n') HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existen nombres de usuario duplicados al eliminar espacios; revise las cuentas antes de migrar';
  END IF;
  UPDATE usuarios SET nombre_usuario=btrim(nombre_usuario, E' \t\r\n')
  WHERE nombre_usuario <> btrim(nombre_usuario, E' \t\r\n');
END $$;
