func getModuleName(suffix string) string => '10x-flowerpot-${suffix}'

module staticWebAppModule 'resources/static-web-app.bicep' = {
  name: getModuleName('static-web-app')
}
