param storageAccountName string
param principalId string

resource storageTableDataContributorRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  scope: subscription()
  name: '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storageAccount
  name: guid(
    storageAccount.id,
    principalId,
    storageTableDataContributorRole.name
  )
  properties: {
    roleDefinitionId: storageTableDataContributorRole.id
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}
