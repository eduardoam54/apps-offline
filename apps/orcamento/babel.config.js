// O plugin inline-import embute o conteudo dos .sql gerados pelo drizzle-kit
// direto no bundle, para as migracoes rodarem no aparelho sem acesso a disco.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
