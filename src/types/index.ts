export interface Tag {
  id: string;
  nome: string;
  tipo: "contexto" | "frequencia" | "regra" | "projeto" | "custom";
  cor: string;
}

export interface Transacao {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  conta: string;
  tagIds: string[];
  recorrente?: boolean;
  comentario?: string;
}

export interface Conta {
  id: string;
  nome: string;
  saldo: number;
}

export interface Regra {
  id: string;
  condicao: string;
  tagIds: string[];
}
