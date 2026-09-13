param principalId string

resource roleBasedAccessControlAdministrationRole 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  scope: subscription()
  name: 'f58310d9-a9f6-439a-9e8d-f62e7b41a168'
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: resourceGroup()
  name: guid(
    resourceGroup().id,
    principalId,
    roleBasedAccessControlAdministrationRole.name
  )
  properties: {
    roleDefinitionId: roleBasedAccessControlAdministrationRole.id
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

output roleAssignmentId string = roleAssignment.id
