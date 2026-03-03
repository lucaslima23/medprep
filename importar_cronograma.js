import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Carrega as variáveis do seu arquivo .env
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dados baseados no seu PDF da Trilha ENARE 
const cronogramaENARE = {
  startDate: "2026-02-09",
  endDate: "2026-03-08", // Focando no primeiro mês (Semanas 1 a 4)
  days: [
    { date: "2026-02-09", title: "Medicina de Família / APS", subject: "PREVENTIVA", subSubject: "Atenção Básica", summary: "Estudo teórico de MFC e APS [cite: 37]", videoId: "", pdfId: "" },
    { date: "2026-02-12", title: "Abdome Agudo Inflamatório", subject: "CIRURGIA", subSubject: "Abdome Agudo", summary: "Apendicite, Colecistite e Diverticulite [cite: 37]", videoId: "", pdfId: "" },
    { date: "2026-02-16", title: "Abdome Agudo (Vascular/Hemorrágico)", subject: "CIRURGIA", subSubject: "Abdome Agudo", summary: "Vascular, Hemorrágico, Perfurativo e Obstrutivo [cite: 44]", videoId: "", pdfId: "" },
    { date: "2026-02-19", title: "Imunizações e Ética", subject: "PEDIATRIA", subSubject: "Imunizações", summary: "Imunizações e Ética Médica [cite: 44]", videoId: "", pdfId: "" },
    { date: "2026-02-23", title: "Ginecologia Geral", subject: "GINECOLOGIA", subSubject: "Ciclo Menstrual e Amenorreia", summary: "Ciclo menstrual, Miomatose e Endometriose [cite: 51]", videoId: "1i5pEis9F5uMy_Zd49hyUHUjMPPbs4rTc", pdfId: "1JKczTEmUDXDRG7kYuX4wfd8LxMQHh7XT" },
    { date: "2026-03-02", title: "Pré-Natal e Trauma", subject: "OBSTETRICIA", subSubject: "Pré-Natal", summary: "Modificações fisiológicas e Trauma ", videoId: "", pdfId: "" },
    { date: "2026-03-07", title: "Super Simu 01 (Semanas 1-4)", subject: "GERAL", subSubject: "Simulado", summary: "Simulado de 100 questões ", videoId: "", pdfId: "" }
  ]
};

async function subirDados() {
  try {
    const docRef = await addDoc(collection(db, "schedules"), cronogramaENARE);
    console.log("✅ Cronograma ENARE (Semanas 1-4) enviado com sucesso!");
    console.log("ID do documento:", docRef.id);
    process.exit();
  } catch (e) {
    console.error("❌ Erro ao enviar para o Firebase:", e);
  }
}

subirDados();