const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const fs = require("fs");

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Função para ler o JSON e subir em lotes
async function uploadBulario() {
  try {
    console.log("Lendo arquivo JSON...");
    // Lê o arquivo do bulário (certifique-se que o nome está correto)
    const rawData = fs.readFileSync("bulario.json");
    const medicamentos = JSON.parse(rawData);

    console.log(`Total de medicamentos encontrados: ${medicamentos.length}`);

    const batchSize = 400; // Tamanho do lote (segurança para não estourar o limite de 500)
    let batch = db.batch();
    let counter = 0;
    let totalUploaded = 0;

    for (const [index, item] of medicamentos.entries()) {
      // Cria uma referência de documento. 
      // Se o remédio tiver um ID único no JSON, use .doc(item.id), senão use .doc() para ID automático
      const docRef = db.collection("medicamentos").doc(); 
      
      batch.set(docRef, item);
      counter++;

      // Se atingir o tamanho do lote, envia (commit)
      if (counter === batchSize || index === medicamentos.length - 1) {
        await batch.commit();
        totalUploaded += counter;
        console.log(`Subiu ${totalUploaded} medicamentos...`);
        
        // Reinicia o batch e o contador
        batch = db.batch();
        counter = 0;
      }
    }

    console.log("Sucesso! Todos os medicamentos foram enviados para o Firestore.");

  } catch (error) {
    console.error("Erro ao subir dados:", error);
  }
}

uploadBulario();