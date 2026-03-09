export interface Tag {
  id: string;
  nome: string;
  cor: string;
  parentId?: string; // subtag do nível 1; subtag de subtag = nível 2 (máx)
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
