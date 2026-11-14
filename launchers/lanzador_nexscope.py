# -*- coding: utf-8 -*-
"""
LANZADOR SILENCIOSO NEX-SCOPE (Radar & Inteligencia Estratégica)
Corre SIN ventana (invocado por INICIAR-NEX-SCOPE.vbs o INICIAR-ECOSISTEMA.vbs).
1. Si NEX-SCOPE ya responde en el puerto configurado -> solo abre el navegador.
2. Si otro lanzador tiene el lock activo -> solo abre el navegador.
3. Si no existen node_modules -> lanza start.bat visible para instalación limpia y prisma db push.
4. Si las dependencias están listas -> arranca Next.js oculto (CREATE_NO_WINDOW),
   guarda log en .server_log.txt, espera /api/health y abre el navegador automáticamente.
5. Si en 90s no responde -> abre .server_log.txt en el Bloc de notas.
"""
import os
import sys
import time
import webbrowser
import subprocess
import urllib.request

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(BASE, ".server_log.txt")
LOCK = os.path.join(BASE, ".server.lock")
CREATE_NO_WINDOW = 0x08000000


def get_port():
    port = 3000
    env_local = os.path.join(BASE, ".env.local")
    env_file = os.path.join(BASE, ".env")
    for fpath in (env_local, env_file):
        if os.path.exists(fpath):
            try:
                with open(fpath, encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("PORT="):
                            port = int(line.split("=", 1)[1].strip() or 3000)
                            return port
            except Exception:
                pass
    return port


PORT = get_port()
URL = f"http://localhost:{PORT}"


def healthy(timeout=2.0):
    try:
        req = urllib.request.Request(
            f"{URL}/api/health",
            headers={"User-Agent": "NEX-SCOPE-Launcher/1.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.getcode() == 200
    except Exception:
        # Fallback si /api/health responde cualquier 2xx/3xx o el root responde
        try:
            with urllib.request.urlopen(f"{URL}/", timeout=timeout) as resp:
                return resp.getcode() in (200, 304, 307, 308)
        except Exception:
            return False


def node_modules_ok():
    nm = os.path.join(BASE, "node_modules")
    next_bin = os.path.join(nm, "next")
    return os.path.exists(nm) and os.path.exists(next_bin)


def launch():
    # 1. Si ya responde -> abrir y salir
    if healthy():
        webbrowser.open(URL)
        return 0

    # 2. Si otro lanzador está en marcha -> abrir y salir
    if os.path.exists(LOCK):
        try:
            pid = int(open(LOCK, "r", encoding="utf-8").read().strip())
            os.kill(pid, 0)
            webbrowser.open(URL)
            return 0
        except Exception:
            try:
                os.remove(LOCK)
            except Exception:
                pass

    # 3. Si no hay dependencias -> abrir asistente visible auto-instalador
    if not node_modules_ok():
        subprocess.Popen(
            ["cmd", "/c", os.path.join(BASE, "launchers", "start.bat")],
            creationflags=0x00000010,  # CREATE_NEW_CONSOLE
        )
        return 0

    with open(LOCK, "w", encoding="utf-8") as f:
        f.write(str(os.getpid()))

    try:
        log = open(LOG, "w", encoding="utf-8", errors="replace")
        env = os.environ.copy()
        env["PORT"] = str(PORT)
        env["NODE_ENV"] = "development"

        # Usar npx next dev o npm run dev
        cmd = f"npx next dev -p {PORT}"
        subprocess.Popen(
            ["cmd.exe", "/c", cmd],
            cwd=BASE,
            stdout=log,
            stderr=subprocess.STDOUT,
            env=env,
            creationflags=CREATE_NO_WINDOW,
            close_fds=True,
        )

        # 4. Esperar arranque (hasta 90 segundos)
        deadline = time.time() + 90
        while time.time() < deadline:
            if healthy():
                webbrowser.open(URL)
                return 0
            time.sleep(2)

        # 5. Si no respondió a tiempo, mostrar log para diagnóstico
        if os.path.exists(LOG):
            subprocess.Popen(["notepad.exe", LOG])
        return 1

    finally:
        try:
            if os.path.exists(LOCK):
                os.remove(LOCK)
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(launch())
