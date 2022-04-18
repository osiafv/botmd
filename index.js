 "use strict";
 const proces = require('process') 
 proces.on('uncaughtException', console.error)
 
 const { 
 default: 
   makeWASocket,
   useSingleFileAuthState,
   DisconnectReason,
   fetchLatestBaileysVersion,
   makeInMemoryStore,
   jidDecode, 
   downloadContentFromMessage
 } = require('@adiwajshing/baileys');
 
 const PhoneNumber = require('awesome-phonenumber')
 const { Boom } = require('@hapi/boom')   
 const fs = require('fs')      
 const pino = require ('pino'); 
 const CFonts = require('cfonts');
 const Options = require('./FunctionMD/settings/options.js')
 const { info } = Options
 const { color, bgcolor, ConsoleLog, getBuffer } = require('./FunctionMD/function.js')
 const { state, saveState } = useSingleFileAuthState('./meita_multi.json');    
 const { groupResponse } = require('./FunctionMD/response/group.js')
 const { move } = require('./FunctionMD/base/mybase')
 const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
 
 try{
 async function connectToWhatsApp () {
 
 setTimeout( () => {

 CFonts.say(info.botName, {
	font: 'tiny',
	align: 'center',
	colors: ['red'],
	background: 'yellow',
	letterSpacing: 1,
	space: true,
 });
 CFonts.say(info.ownerName, {
	font: 'console',
	align: 'center',
	colors: ['white'],
	background: 'transparent',
	letterSpacing: 1,
	space: true,
 });
 }, 5000)
      
 const { version } = await fetchLatestBaileysVersion()  
 const meita = makeWASocket({ 
   logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Meita_Multi', 'Aloha', '5.4'],
        auth: state,
        version
 })
 
 store.bind(meita.ev) 
 meita.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {}
          return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    

   meita.sendContact = (jid, numbers, name, quoted, mbuh) => {
	 let number = numbers.replace(/[^0-9]/g, '')
     const vcard = 'BEGIN:VCARD\n' 
     + 'VERSION:3.0\n' 
     + 'FN:' + name + '\n'
	 + 'ORG:;\n'
	 + 'TEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\n'
	 + 'END:VCARD'
  	 return meita.sendMessage(jid, { contacts: { displayName: name, contacts: [{ vcard }] }, mentions : mbuh ? mbuh : []},{ quoted: quoted })
   }
    meita.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
	let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        // save to file
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }
 meita.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'connecting'){
             console.log('[ INF ]', update) 
             }                         	             
       if (connection === 'close') {
         let messageconnect = new Boom(lastDisconnect?.error)?.output.statusCode
            if (messageconnect === DisconnectReason.badSession) { 
               console.log(`Sorry, it looks like the session file is disabled. Please re-scan🙏`)      
               meita.logout();         
              } else if (messageconnect === DisconnectReason.connectionClosed) { 
               console.log("Connection lost, trying to reconnect🔄"); 
               connectToWhatsApp(); 
              } else if (messageconnect === DisconnectReason.connectionReplaced) { 
               console.log("Another connection is replaced, please close this connection first");    
               meita.logout();           
              } else if (messageconnect === DisconnectReason.restartRequired) { 
               console.log("An error occurred, reconnecting🔄"); 
               connectToWhatsApp();
              } else if (messageconnect === DisconnectReason.connectionLost) { 
               console.log("Connection lost from the web, trying to reconnect🔄"); 
               connectToWhatsApp();               
              } else if (messageconnect === DisconnectReason.loggedOut) { 
              console.log(`Device is out, please re-scan🔄`);    
              meita.logout();               
              } else if (messageconnect === DisconnectReason.timedOut) { 
               console.log("Connection reached the limit, please reload🔄"); 
               connectToWhatsApp(); 
             } else meita.end(`Reason : ${messageconnect}|${connection}`)
           }                         
        })    

 meita.ev.on('creds.update', saveState);  
 
 store.bind(meita.ev)  
 
  meita.ev.on('messages.upsert', async ({ messages }) => {
  
    const m = messages[0];        
    const from = m.key.remoteJid

    await move(meita, m, store)
    require('./FunctionMD/message/Meita_Multi.js')(meita, m, store)
    await meita.sendPresenceUpdate('paused', from)   
  })
  
  meita.ev.on('group-participants.update', async (update) =>{
   groupResponse(meita, update)
   console.log(update)
   })         
 /*
 * Run main file;
 */
  } 
 connectToWhatsApp()
 
 } catch(e) { 
  e = String(e) 
  if (e.includes('Connection Closed')){ return }
  if (e.includes('Timed Out')){ return }
  
  console.log(e)
 }
 
 const LordMeita = require.resolve(__filename)
 fs.watchFile(LordMeita, () => {
 fs.unwatchFile(LordMeita)
 console.log(color(`New! >`, 'yellow'), color(`${__filename}`, 'orange'))
 delete require.cache[LordMeita]
 require(LordMeita)
 } )
 