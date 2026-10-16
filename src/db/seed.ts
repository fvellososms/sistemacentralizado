import "dotenv/config";
import { db, pool } from "./index";
import { projects, userProfiles, rdos, rdoContractors, rdoActivities, rdoNonConformities, rdoOccurrences, rdoPhotos } from "./schema";
import { sql } from "drizzle-orm";

export async function runSeed() {
  console.log("Starting database seeding...");

  // Clear existing data safely
  await db.execute(sql`TRUNCATE TABLE rdo_photos, rdo_occurrences, rdo_non_conformities, rdo_activities, rdo_contractors, rdos, user_profiles, projects RESTART IDENTITY CASCADE;`);

  // 1. Projects
  const [p1, p2, p3] = await db.insert(projects).values([
    {
      name: "Edifício Residencial Horizonte Azul",
      code: "OBRA-2026-01",
      companyName: "Construtora Aliança S/A",
      address: "Av. das Nações Unidas, 3500 - Brooklin, São Paulo - SP",
      managerName: "Eng. Roberto Albuquerque (CREA 50612345)",
      status: "Em andamento",
      startDate: "2026-01-15",
    },
    {
      name: "Torre Corporativa Platinum Office",
      code: "OBRA-2026-02",
      companyName: "Construtora Aliança S/A",
      address: "Rua Funchal, 720 - Vila Olímpia, São Paulo - SP",
      managerName: "Eng. Mariana Campos (CREA 50987654)",
      status: "Em andamento",
      startDate: "2026-03-01",
    },
    {
      name: "Residencial Parque das Árvores",
      code: "OBRA-2026-03",
      companyName: "Construtora Aliança S/A",
      address: "Al. dos Guatás, 140 - Saúde, São Paulo - SP",
      managerName: "Eng. Roberto Albuquerque (CREA 50612345)",
      status: "Em andamento",
      startDate: "2026-04-10",
    },
  ]).returning();

  // 2. User profile
  await db.insert(userProfiles).values({
    name: "Alberto Martins",
    email: "carlos.silva@construtora.com.br",
    role: "Encarregado Geral de Obra",
    cpf: "284.915.738-92",
    phone: "(11) 98765-4321",
    birthDate: "1985-06-14",
    address: "Rua das Palmeiras, 340, Apto 52 - Santana, São Paulo - SP",
    department: "Engenharia & Produção",
    avatarUrl: "https://images.pexels.com/photos/8960995/pexels-photo-8960995.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    passwordHash: "123456",
  });

  // Calculate dates around current date:
  // Today, and past days of the current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayOfWeekNames = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  const samplePhotos = [
    {
      url: "https://images.pexels.com/photos/8961260/pexels-photo-8961260.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      caption: "Alinhamento das formas e conferência de projeto estrutural",
    },
    {
      url: "https://images.pexels.com/photos/8961133/pexels-photo-8961133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      caption: "Inspeção técnica dos pontos de tubulação e caixas de passagem",
    },
    {
      url: "https://images.pexels.com/photos/18162495/pexels-photo-18162495.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      caption: "Içamento de ferragens com grua torre para a laje superior",
    },
    {
      url: "https://images.pexels.com/photos/36782541/pexels-photo-36782541.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      caption: "Chegada dos caminhões betoneira e teste de abatimento slump",
    },
    {
      url: "https://images.pexels.com/photos/35300835/pexels-photo-35300835.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      caption: "Equipe realizando vibração e nivelamento do concreto usinado",
    },
    {
      url: "https://images.pexels.com/photos/31637239/pexels-photo-31637239.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      caption: "Execução de alvenaria de vedação com bloco cerâmico e amarração",
    },
  ];

  // Let's create 12 RDO records across the month to provide a rich calendar, list, and histogram
  const daysToCreate = [
    { dayOffset: 0, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "sol", own: 8, extraHh: 2 },
    { dayOffset: -1, hasOcc: true, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "chuva", own: 9, extraHh: 0 },
    { dayOffset: -2, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "parcialmente_nublado", own: 8, extraHh: 1 },
    { dayOffset: -3, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "parcialmente_nublado", aWeather: "sol", own: 7, extraHh: 0 },
    { dayOffset: -4, hasOcc: true, status: "trabalhando", cond: "praticavel", mWeather: "nublado", aWeather: "nublado", own: 8, extraHh: 3 },
    { dayOffset: -5, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "sol", own: 8, extraHh: 0 },
    { dayOffset: -7, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "sol", own: 7, extraHh: 0 },
    { dayOffset: -8, hasOcc: true, status: "trabalhando", cond: "praticavel", mWeather: "chuva", aWeather: "nublado", own: 8, extraHh: 0 },
    { dayOffset: -9, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "sol", own: 8, extraHh: 2 },
    { dayOffset: -10, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "sol", own: 8, extraHh: 0 },
    { dayOffset: -11, hasOcc: true, status: "paralisado_chuva", cond: "impraticavel", mWeather: "chuva", aWeather: "chuva", own: 4, extraHh: 0 },
    { dayOffset: -12, hasOcc: false, status: "trabalhando", cond: "praticavel", mWeather: "sol", aWeather: "sol", own: 8, extraHh: 0 },
  ];

  let rdoSeq = 135;

  for (const item of daysToCreate) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + item.dayOffset);

    // Skip Sundays
    if (targetDate.getDay() === 0) continue;

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dow = dayOfWeekNames[targetDate.getDay()];

    const contractors = [
      { name: "EletroForte Engenharia", trade: "Instalações Elétricas", count: 3 },
      { name: "HidroArte Tubulações", trade: "Instalações Hidrossanitárias", count: 4 },
      { name: "AçoMax Armações", trade: "Armação e Estruturas Metálicas", count: 5 },
    ];

    const contractorTotal = contractors.reduce((sum, c) => sum + c.count, 0);
    const totalWorkers = item.own + contractorTotal;
    const standardHours = item.status === "paralisado_chuva" ? 4 : 8;
    const totalHhValue = (totalWorkers * standardHours + item.extraHh * totalWorkers).toFixed(1);

    const [createdRdo] = await db.insert(rdos).values({
      projectId: p1.id,
      rdoNumber: rdoSeq++,
      date: dateStr,
      dayOfWeek: dow,
      dayStatus: item.status,
      workCondition: item.cond,
      weatherMorning: item.mWeather,
      weatherAfternoon: item.aWeather,
      ownTeamCount: item.own,
      contractorTeamCount: contractorTotal,
      totalHeadcount: totalWorkers,
      totalHh: totalHhValue,
      hasOccurrences: item.hasOcc,
      observations: item.hasOcc
        ? "Dia com registro de ocorrências operacionais documentadas e tratadas em ata de canteiro."
        : "Serviços transcorreram dentro do cronograma previsto sem intercorrências graves.",
      authorName: "Alberto Martins",
      status: "concluido",
    }).returning();

    // Contractors
    for (const c of contractors) {
      await db.insert(rdoContractors).values({
        rdoId: createdRdo.id,
        companyName: c.name,
        trade: c.trade,
        workerCount: c.count,
      });
    }

    // Activities
    const act1 = await db.insert(rdoActivities).values({
      rdoId: createdRdo.id,
      description: "Concretagem da laje e vigas superiores do Bloco A",
      location: "Bloco A - 5º Pavimento",
      status: "concluido",
      hasOvertime: item.extraHh > 0,
      overtimeHours: item.extraHh.toFixed(1),
    }).returning();

    const act2 = await db.insert(rdoActivities).values({
      rdoId: createdRdo.id,
      description: "Montagem de formas dos pilares periféricos P14 a P20",
      location: "Bloco B - 4º Pavimento",
      status: "em_andamento",
      hasOvertime: false,
      overtimeHours: "0",
    }).returning();

    const act3 = await db.insert(rdoActivities).values({
      rdoId: createdRdo.id,
      description: "Passagem de tubulações primárias de esgoto e prumadas de água",
      location: "Subsolo 1 e Garagem",
      status: "em_andamento",
      hasOvertime: false,
      overtimeHours: "0",
    }).returning();

    // Occurrences if hasOcc
    if (item.hasOcc) {
      await db.insert(rdoOccurrences).values([
        {
          rdoId: createdRdo.id,
          orderIndex: 1,
          category: "Entrega de Materiais",
          title: "Atraso no fornecimento de concreto usinado Fck 35 MPa",
          description: "Os primeiros dois caminhões betoneira chegaram com 1h20 de atraso devido a retenção no tráfego rodoviário. O ensaio de slump test foi realizado e aprovado.",
          impactedHours: "1.5",
        },
        {
          rdoId: createdRdo.id,
          orderIndex: 2,
          category: "Segurança do Trabalho",
          title: "Auditoria preventiva de EPI e linhas de vida",
          description: "O Técnico de Segurança realizou DDS sobre trabalho em altura e inspecionou os cintos tipo paraquedista de todos os armadores e carpinteiros.",
          impactedHours: "0.5",
        },
      ]);

      await db.insert(rdoNonConformities).values({
        rdoId: createdRdo.id,
        description: "Falta de guarda-corpo provisório na abertura do poço de ventilação no 5º pavimento",
        severity: "alta",
        correctiveAction: "Instalado imediatamente guarda-corpo em madeira compensada com altura de 1,20m e rodapé de 20cm conforme NR-18.",
        status: "resolvido",
      });
    }

    // Photos (2 photos per RDO)
    const photoA = samplePhotos[(createdRdo.id) % samplePhotos.length];
    const photoB = samplePhotos[(createdRdo.id + 1) % samplePhotos.length];

    await db.insert(rdoPhotos).values([
      {
        rdoId: createdRdo.id,
        activityName: act1[0].description,
        nonConformityText: item.hasOcc ? "Conformidade estrutural verificada pós-concretagem" : null,
        goodPracticeText: "Vibração mecânica contínua e cura úmida programada",
        caption: photoA.caption,
        photoUrl: photoA.url,
        timestamp: `${dateStr} 10:45:22`,
        locationText: "Edifício Residencial Horizonte Azul • Bloco A - 5º Pavimento",
        showWatermark: true,
      },
      {
        rdoId: createdRdo.id,
        activityName: act2[0].description,
        nonConformityText: null,
        goodPracticeText: "Uso obrigatório de cinto duplo acoplado em cabo guia",
        caption: photoB.caption,
        photoUrl: photoB.url,
        timestamp: `${dateStr} 15:20:10`,
        locationText: "Edifício Residencial Horizonte Azul • Bloco B - 4º Pavimento",
        showWatermark: true,
      },
    ]);
  }

  // Also add 2 RDOs for Project 2 (Torre Platinum)
  const [rdoP2] = await db.insert(rdos).values({
    projectId: p2.id,
    rdoNumber: 42,
    date: `${year}-${String(month + 1).padStart(2, "0")}-05`,
    dayOfWeek: "qua",
    dayStatus: "trabalhando",
    workCondition: "praticavel",
    weatherMorning: "sol",
    weatherAfternoon: "sol",
    ownTeamCount: 12,
    contractorTeamCount: 18,
    totalHeadcount: 30,
    totalHh: "240.0",
    hasOccurrences: false,
    observations: "Execução das estacas hélice contínua e vigas de baldrame.",
    authorName: "Alberto Martins",
    status: "concluido",
  }).returning();

  await db.insert(rdoContractors).values([
    { rdoId: rdoP2.id, companyName: "Fundatec Estaqueamentos", trade: "Fundações Profundas", workerCount: 10 },
    { rdoId: rdoP2.id, companyName: "Topografia Brasil", trade: "Locação e Nivelamento", workerCount: 8 },
  ]);

  await db.insert(rdoActivities).values({
    rdoId: rdoP2.id,
    description: "Perfuração e concretagem de 8 estacas hélice contínua Ø 60cm",
    location: "Setor Sul - Eixo 1-8",
    status: "concluido",
    hasOvertime: false,
    overtimeHours: "0",
  });

  console.log("Database seeded successfully!");
}

if (process.env.RUN_SEED) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
