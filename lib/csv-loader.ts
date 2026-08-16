import fs from "fs";
import path from "path";
import Papa from "papaparse";

const DATA_DIR = path.join(process.cwd(), "Database");

function readCsv<T>(filename: string, delimiter: "," | ";"): T[] {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, "utf8");
  const result = Papa.parse<T>(content, {
    header: true,
    delimiter,
    skipEmptyLines: true,
  });
  return result.data;
}

export type FacturacionRow = {
  FINANCIAL_ACCOUNT_KEY: string;
  CUSTOMER_KEY: string;
  BILLING_ARRANGEMENT_KEY: string;
  LEGAL_INVOICE_NUMBER: string;
  PRIMARY_RESOURCE_VALUE: string;
  BILLING_CYCLE_KEY: string;
  CHARGE_NET_AMOUNT: string;
  CHARGE_TOTAL_AMOUNT: string;
  CHARGE_CODE_ID: string;
  CHARGE_CODE_DESC: string;
  CHARGE_CODE_CLASSIFICATION: string;
  SUBSCRIBER_KEY: string;
  PERIOD_START_DATE: string;
  PERIOD_END_DATE: string;
  ciclo: string;
  GRUPO: string;
  SUB_GRUPO: string;
};

export type ProrrateoRow = {
  BA: string;
  CuentaFinanciera: string;
  Numero: string;
  NumeroRecibo: string;
  Ciclica: string;
  fecha_inicio_minima: string;
  fecha_fin_maxima: string;
  suma_prorrateo: string;
  Q_cargos: string;
  tiponumero: string;
};

export type ReconexionRow = {
  BA: string;
  CuentaFinanciera: string;
  Numero: string;
  Codigo: string;
  NumeroRecibo: string;
  Descripcion: string;
  FechaReconexion: string;
  Monto: string;
  Ciclica: string;
  FechaCorte: string;
};

export type ClienteRow = {
  COD_CLIENTE: string;
  FINANCIAL_ACCOUNT: string;
  NUM_ANEXO: string;
  telefono_hash: string;
  fecha_activacion_original: string;
  ciclo: string;
  lob_type: string;
  negocio: string;
};

export type CatalogoRow = {
  "CHARGE CODE": string;
  rate_final: string;
  "TIPO DE RENTA": string;
};

let facturacionCache: FacturacionRow[] | null = null;
let prorrateoCache: ProrrateoRow[] | null = null;
let reconexionCache: ReconexionRow[] | null = null;
let clientesCache: ClienteRow[] | null = null;
let catalogoCache: CatalogoRow[] | null = null;

export function loadFacturacion(): FacturacionRow[] {
  if (!facturacionCache) {
    facturacionCache = readCsv<FacturacionRow>("FACTURACION-CLIENTES.csv", ",");
  }
  return facturacionCache;
}

export function loadProrrateo(): ProrrateoRow[] {
  if (!prorrateoCache) {
    prorrateoCache = readCsv<ProrrateoRow>("BRAINY_PRORRATEO_ALTASV3.csv", ";");
  }
  return prorrateoCache;
}

export function loadReconexion(): ReconexionRow[] {
  if (!reconexionCache) {
    reconexionCache = readCsv<ReconexionRow>("BRAINY_RECONEXIONESV3.csv", ";");
  }
  return reconexionCache;
}

export function loadClientes(): ClienteRow[] {
  if (!clientesCache) {
    clientesCache = readCsv<ClienteRow>("PLANTA CLIENTES.csv", ";");
  }
  return clientesCache;
}

export function loadCatalogo(): CatalogoRow[] {
  if (!catalogoCache) {
    catalogoCache = readCsv<CatalogoRow>("CATALOGO-OFERTAS.csv", ";");
  }
  return catalogoCache;
}
