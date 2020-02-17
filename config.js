var config = {
  buildDir: "build/",
  distDir: "dist/",
  jscrambler: {
    keys: {
      accessKey: "",
      secretKey: "",
    },
    applicationId: "",
    params: [{
        name: 'identifiersRenaming'
      },
      {
        name: 'whitespRemoval'
      },
      {
        name: 'booleanToAnything'
      },
      {
        name: 'numberToString',
        options: {}
      },
      {
        name: 'charToTernaryOperator'
      },
      {
        name: 'deadCodeInjection'
      },
      {
        name: 'dotToBracketNotation'
      },
      {
        name: 'duplicateLiteralsRemoval'
      },
      {
        name: 'functionOutlining'
      },
      {
        name: 'stringSplitting'
      }
    ]
  },
  stages: {
    dev: {
      name: "dev",
      Mname: "Password Extension-dev",
      Mdescription: "__MSG_pd_description__",
      Mhomepage_url: "https://acebit.com",
      Mgecko_id: "passwordepot-dev@acebit.com",
      addonId:"bdaleddhigccnaobbdoanllgedjnndmb",
      googleOauth2ClientId:"",
      chromePrivateKey:"\"key\":"+"\"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnB3/OeLdfLFfWbtp7Hgna7hBqrutov7/sWx0roNK6vNTBhUKz0Iwf23Pi9KTQ2qNIte46aWRy5UqOMzL9Tv1Z15iddeV3kykQLYYZ58MQ4/K6fe91XLgNz1ymKR5jRbd89CDKgosGPB7vgmm4aa7trAbYBnDCcJOnm2hQgMOB6fMwHAMCORCTXapFSqzSV6DjXc457yDNN7BfcO+TXNjA5kE98LLRfJC96qjEWcjRZQYuyWVWP9FPE3rNMOdaNXdhMqeKft4TZW3tW9y0BDzBPUzrL1D3gCYHL9hPp5gPT3kwqKdnIa4goLy3W56GTvPSZjUNITmH3Uj2hZCn+6znQIDAQAB\","
    },
    production: {
      name: "production",
      Mname: "Password Depot Extension",
      Mdescription: "__MSG_pd_description__",
      Mhomepage_url: "https://www.password-depot.de",
      Mgecko_id: "{427859bd-061c-4095-bd2b-845962f45f43}",
      addonId:"ggojliohohbachojmcgelnjmnjmjgidn",
      googleOauth2ClientId:"",
      chromePrivateKey:"\"key\":"+"\"\","
    }
  },
  browsers: {
    chrome: {
      name: "chrome",
      dir: "chrome/",
      clientId:"",
      clientSecret:"",
      refreshToken:"",
    },
    safari: {
      name: "safari",
      dir: "safari/"
    },
    firefox: {
      name: "firefox",
      dir: "firefox/",
      apiKey: "",
      apiSecret: ""
    },
  }
};
exports.config = config;
