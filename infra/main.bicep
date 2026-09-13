func getModuleName(suffix string) string => '10x-flowerpot-${suffix}'

module staticWebAppModule 'resources/static-web-app.bicep' = {
  name: getModuleName('static-web-app')
}

module storageAccountModule 'resources/storage-account.bicep' = {
  name: getModuleName('storage-account')
  params: {
    swaIdentityPrincipalId: staticWebAppModule.outputs.principalId
  }
}

output staticWebAppName string = staticWebAppModule.outputs.name
output staticWebAppHostname string = staticWebAppModule.outputs.hostname
output storageAccountName string = storageAccountModule.outputs.name
