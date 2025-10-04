module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: './react-native-sqlite-storage.podspec',
      },
      android: {
        sourceDir: './platforms/android',
        packageImportPath: 'import org.pgsqlite.SQLitePluginPackage;',
        packageInstance: 'new SQLitePluginPackage()',
      },
    },
  },
};
