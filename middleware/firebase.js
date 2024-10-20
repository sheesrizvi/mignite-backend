const admin = require('firebase-admin')
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDl7pHxR84rjb5I\nRpL+hvVmXf9yhAjDcXcfG7i6t+54G57LiWyRfG9+3TZP1wE5Cv5W6uojDZJEQxwC\nlpuro/ifqJ3tpR79qBfdFE6UdIC0jp/pl+zT2cykUSv7iBjsmlxsc0MehDKPFEAf\n56ZMnLJK4G4OfLx0t/QEC6eFJodisza5rupeDBKqtzN1lEeNjO36F2jEM0dhRVXf\nTtNncilZs2tsvXSqpHsipGKOpXO/ZaJmbDK1B9OIebDl2NsfS1b0HRJLcghVtSCE\nxksMzT8uV/JX3DqnXbMcsqKsBlDNPhZ0u4LmcECZcBhhmKQM52dcjeBzA/o0hk6M\nlBOU/IrBAgMBAAECggEANAiUMGUOjB6slBCcjUsfV8Yn29NzZD9WNM0CNgcPyVB+\n1BLKZfYiCTSoaNMALNeHDUZmK/6TPi1ttkw8+E/IIOF4s+HtLHwQwnApBEGFKtcn\n6yX9a0fbnsfbyzVWZpzcE5LV+p7yDh0IEfBLWwUO+BDn9xFVWJiUeSHmDCTW+Iem\nIBvchkRAh/tPj/LtA95MjhIGMotv7lJEbeTELvgKjgrYITuaft+1F8l3DZyUjhtt\ncRTMSJdsIWlUecXZTqjcuhy/fRbIwNLdhbIYe45dWZ9Z0TKkgzC50Y8wkFfthRK8\n8ILKZN6xokJE6OjrGPNs/3TFvpU64dKz082k9lKE7QKBgQD4ob1lPTmlSPN1KX47\nqMisOqhtyP4gZQIBTvyIe26S879u1Pv/XitOlJgWgHBIybD/rlWnfnMe1Z0lB2CZ\nmRKCVVQl7PuKwu2BOc4TMFXig5IkMlm/DmDc25L05pYzfFhvgieCe4X6esgUqCiP\neuI8T5CRmzoVW+04tJrmcCp7awKBgQDsvvZk3WvLx297eY+QxgB5QNSOvn0+biGf\npZ5KydVETYWMA6jiDY2PXcsjmBQpYI1oqT1FgYipkW+c/YRWXfLmJAhdaj9cdLwV\n+IUMfW3V4ALeGoYPlIwjhxDVA41kSza10odiqBq3nNHV28GErwtdpSrs+7557f3h\nEU6E/IHpgwKBgGARxufWd265OHEd/ku5FQkPhUMedas4vESbK5Lk9r3Ldz2xCEoN\nLfioC/gt2rUVUdIJn8kfYAYbDiRfrGDNN8yqgeBBqJRea30SQ+FAPP9QTWi1F95u\nBNlx8l+0tXbhZh54ESIm7obxaFwq+bkvBzm8mKTacOAN7CSMDIpb7t5PAoGBAORP\nnQrUxjo1UPvA1YUGjjphHRuz9NCaIO73J1p0nqlKIXpPpTSrYVNbXqYq6Xal2HmQ\njLhVHVh6GytJCbDI1ZDAOxjrd8NQCHsfuh+7bosNh3ZuGc84sJUqkj77OAX6yv45\n07p+55UfNPWLAmtU7B8ZQ/ZbKOwpaeb9a72wThDFAoGAVfil0VWgutWPnYgb2wFb\nMt7a+UDfmT95j+GiESdN1IcTCe+4wJj4g0yQr6R8sFaBUZX/rcEI5uAY86YWkTwk\n7bM+PLGALbGJX+g3PyImZM2pUb2KTLdvbpl0SIPHQj6OxewMLQYllwlhQhUOlaJ/\nwWppriXBvuESasrXeUVftpk=\n-----END PRIVATE KEY-----\n",
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };
  

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })

 
module.exports = admin