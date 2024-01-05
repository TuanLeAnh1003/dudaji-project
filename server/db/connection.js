const mongoose = require('mongoose');

const url = `mongodb+srv://tuanleanh1003:tuanleanh1003@cluster0.h4faxcu.mongodb.net/?retryWrites=true&w=majority`;

mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log('Connected to DB')).catch((e)=> console.log('Error', e))
