import os, shutil, subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
os.chdir(root)
pm = "bun" if shutil.which("bun") else "npm"
env = dict(os.environ)
env.setdefault("AUTH_SECRET", "ci-build-secret")
env.setdefault("APP_MODE", "demo")
gen_env = dict(env)
gen_env["DATABASE_URL"] = os.environ.get(
    "DATABASE_URL", "postgresql://ci:ci@127.0.0.1:5432/ci"
)

def run(args, check=True, e=None):
    print("==>", " ".join(args))
    subprocess.run(args, check=check, env=e or env)

run([pm, "install"])
if pm == "bun":
    run(["bunx", "prisma", "generate"], e=gen_env)
else:
    run(["npx", "prisma", "generate"], e=gen_env)
run([pm, "run", "lint"], check=False)
run([pm, "run", "build"])
run([pm, "run", "golden"])
print("CI OK")
