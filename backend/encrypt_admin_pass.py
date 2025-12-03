# Script para cifrar la contraseña del admin usando Fernet
from cryptography.fernet import Fernet

# Genera una clave secreta (haz esto una sola vez y guárdala en un lugar seguro)
key = Fernet.generate_key()
print(f"CLAVE SECRETA (guárdala en un lugar seguro): {key.decode()}")

# Cifra la contraseña
fernet = Fernet(key)
password = b"Fran_P789@"
encrypted = fernet.encrypt(password)
print(f"CONTRASEÑA CIFRADA: {encrypted.decode()}")
