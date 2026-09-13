type DeploymentTrigger = 'Manual' | 'Automatic'
param deploymentTrigger DeploymentTrigger = 'Manual'

func getModuleName(suffix string) string => '10x-flowerpot-${suffix}'

module groupIdentityModule 'resources/group-identity.bicep' = if (deploymentTrigger == 'Manual') {
  name: getModuleName('group-identity')
}

module staticWebAppModule 'resources/static-web-app.bicep' = {
  name: getModuleName('static-web-app')
}

module storageAccountModule 'resources/storage-account.bicep' = {
  name: getModuleName('storage-account')
}

output staticWebAppName string = staticWebAppModule.outputs.name
output staticWebAppHostname string = staticWebAppModule.outputs.hostname
output storageAccountName string = storageAccountModule.outputs.name
