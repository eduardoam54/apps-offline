/**
 * Tipagem do `migrations.js` gerado pelo drizzle-kit.
 *
 * O arquivo gerado importa .sql, o que o TypeScript nao entende sozinho — quem
 * resolve isso em tempo de build e o babel-plugin-inline-import. Esta declaracao
 * apenas informa ao TS o formato do que sai de la.
 */
declare const migracoes: {
  journal: {
    entries: {
      idx: number;
      when: number;
      tag: string;
      breakpoints: boolean;
    }[];
  };
  migrations: Record<string, string>;
};

export default migracoes;
