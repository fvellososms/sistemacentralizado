import "dotenv/config";
import { db } from "../../src/db/index";
import { projects } from "../../src/db/schema";

async function add() {
  await db.insert(projects).values([
    {
      name: "Hotel Marina",
      code: "HM-01",
      companyName: "Construtora",
      address: "Endereço do Hotel Marina",
      managerName: "Gerente",
      status: "Em andamento",
      startDate: "2026-09-01",
    },
    {
      name: "Smart Fit Leme",
      code: "SFL-01",
      companyName: "Construtora",
      address: "Endereço Smart Fit Leme",
      managerName: "Gerente",
      status: "Em andamento",
      startDate: "2026-09-01",
    },
    {
      name: "LMSG Galpão 29",
      code: "LMSG-29",
      companyName: "Construtora",
      address: "Endereço Galpão",
      managerName: "Gerente",
      status: "Em andamento",
      startDate: "2026-09-01",
    },
  ]);
  console.log("Added new projects!");
}

add()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

