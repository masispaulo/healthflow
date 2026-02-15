export interface Drug {
    id: string;
    name: string;
    type: 'sedativo' | 'vasoativo' | 'analgesico' | 'antiarritmico' | 'antibiotico' | 'outros';
    indications: string;
    doseAdulto: string;
    dosePed: string;
    diluicao: string;
    cuidados: string;
    // Propriedades para a Calculadora Integrada
    math?: {
      concentration: number; // mg/ml
      doseKg: number;        // mg/kg padrão
      unit: 'ml' | 'gotas';
      maxDose?: number;      // Teto
      obs?: string;          // Ex: "Dose de Ataque"
    };
  }
  
  export const emergencyDrugs: Drug[] = [
    {
      id: 'midazolam',
      name: 'Midazolam (Dormonid)',
      type: 'sedativo',
      indications: 'Sedação, Convulsão, IOT',
      doseAdulto: '5-10mg IV (Dose ataque).',
      dosePed: '0.1 a 0.2 mg/kg.',
      diluicao: '15mg/3ml (5mg/ml) ou 50mg/10ml (5mg/ml).',
      cuidados: 'Depressão respiratória e hipotensão.',
      math: {
        concentration: 5, // 5mg/ml
        doseKg: 0.1,      // 0.1 mg/kg
        unit: 'ml',
        obs: 'Sedação Leve (0.1mg/kg)'
      }
    },
    {
      id: 'fentanil',
      name: 'Fentanil',
      type: 'sedativo',
      indications: 'Analgesia potente, IOT',
      doseAdulto: '50-100mcg (1-2ml).',
      dosePed: '1-2 mcg/kg.',
      diluicao: '50mcg/ml (0.05mg/ml).',
      cuidados: 'Rigidez torácica (se rápido).',
      math: {
        concentration: 0.05, // 0.05mg/ml
        doseKg: 0.001,       // 1mcg = 0.001mg
        unit: 'ml',
        obs: 'Dose: 1mcg/kg'
      }
    },
    {
      id: 'ketamina',
      name: 'Cetamina (Ketamin)',
      type: 'sedativo',
      indications: 'Sedação dissociativa, Asma grave',
      doseAdulto: '1-2 mg/kg IV.',
      dosePed: '1-2 mg/kg IV.',
      diluicao: '50mg/ml.',
      cuidados: 'Pode causar alucinações e sialorreia.',
      math: {
        concentration: 50,
        doseKg: 1.5,
        unit: 'ml',
        obs: 'Dose média: 1.5mg/kg'
      }
    },
    {
      id: 'dipirona',
      name: 'Dipirona Sódica',
      type: 'analgesico',
      indications: 'Dor e Febre',
      doseAdulto: '1g IV (2ml).',
      dosePed: '10-20 mg/kg.',
      diluicao: '500mg/ml.',
      cuidados: 'Hipotensão se rápido. Alergia.',
      math: {
        concentration: 500,
        doseKg: 20, // 20mg/kg
        unit: 'ml',
        obs: 'Dose usual: 20mg/kg'
      }
    },
    {
      id: 'ceftriaxona',
      name: 'Ceftriaxona (Rocefin)',
      type: 'antibiotico',
      indications: 'Infecções bacterianas graves, Meningite',
      doseAdulto: '1g a 2g IV 24/24h.',
      dosePed: '50-100 mg/kg/dia.',
      diluicao: 'Reconstituir 1g em 10ml AD (100mg/ml).',
      cuidados: 'Não misturar com Ringer Lactato (Cálcio).',
      math: {
        concentration: 100, // Considerando reconstituição padrão
        doseKg: 50,
        unit: 'ml',
        obs: 'Dose: 50mg/kg'
      }
    },
    {
      id: 'adrenalina',
      name: 'Adrenalina (Epinefrina)',
      type: 'vasoativo',
      indications: 'PCR, Anafilaxia',
      doseAdulto: 'PCR: 1mg puro. Anafilaxia: 0.3-0.5mg IM.',
      dosePed: 'PCR: 0.01mg/kg (0.1ml/kg da 1:10.000).',
      diluicao: '1mg/ml (ampola).',
      cuidados: 'Taquicardia extrema.',
      math: {
        concentration: 1,
        doseKg: 0.01,
        unit: 'ml',
        obs: 'Dose PCR (0.01mg/kg)'
      }
    },
      {
      id: 'ondansetrona',
      name: 'Ondansetrona (Zofran)',
      type: 'outros',
      indications: 'Náuseas e vômitos',
      doseAdulto: '4-8mg IV.',
      dosePed: '0.15 mg/kg.',
      diluicao: '2mg/ml.',
      cuidados: 'QT Longo.',
      math: {
        concentration: 2,
        doseKg: 0.15,
        unit: 'ml',
        obs: 'Dose: 0.15mg/kg'
      }
    }
  ];