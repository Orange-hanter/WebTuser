module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@services": "./src/services",
            "@contexts": "./src/contexts",
            "@hooks": "./src/hooks",
            "@types": "./src/types",
            "@navigation": "./src/navigation",
            "@utils": "./src/utils",
          },
        },
      ],
    ],
  };
};
