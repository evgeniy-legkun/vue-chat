<template>
    <div>
        <h1>Socket chat</h1>

        <!-- Connection status -->
        <p v-if="isConnected">CONNECTED</p>
        <p v-else>DISCONNECTED</p>

        <div v-if="userJoined">
            <button @click="detachUserFromChat">Detach user</button>
            <button @click="socketMessages = []" style="margin-left: 7px">Clear messages</button>

            <p>Messages {{ socketMessages | count }}</p>
            <br><br>
            <div style="display: flex; justify-content: center">
                <div style="width: 400px; height: 500px; border: 1px solid black; text-align: left; overflow-y: scroll">
                    <input @keyup.enter="sendMessage($event)" type="text">

                    <div v-for="(message, index) in socketMessages" :key="'message_' + index" class="message">
                        <span>{{ message }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div v-else>
            <p>Enter you name :</p>
            <input v-model="userName" type="text">
            <br><br>
            <button @click="joinUserToChat(false)">
                Join to chat
            </button>
            <button @click="joinUserToChat(true)" style="margin-left: 7px">
                Join as anonymous
            </button>
        </div>
    </div>
</template>

<script>

    export default {
        data() {
            return {
                userName: '',

                userJoined: false,

                isConnected: false,

                socketMessages: []
            }
        },

        filters: {
            count(array) {
                return Array.isArray(array)
                    ?  array.length
                    : null;
            }
        },

        sockets:{
            connect() {
                this.setStatus(true);
            },

            disconnect() {
                this.setStatus(false);
            },

            message(response) {
                this.printMessage(response);
            },

            messages_loaded(messages) {
                this.socketMessages.concat(messages);
            },

            error(error) {
                console.log(error);
            }
        },

        methods: {

            setStatus(status) {
                this.isConnected = status;
                console.log(status ? 'Connected with server' : 'Disconnected');
            },

            joinUserToChat(asAnonymous){
                if (asAnonymous) { this.userName = 'Anonymous'; }

                if (!this.userName) { return; }

                this.userJoined = true;
                this.$socket.emit('join_user', { userName: this.userName });
            },

            detachUserFromChat(){
                this.$socket.emit('detach_user');
                this.userName = '';
                this.userJoined = false;
            },

            sendMessage(eventObject){
                if (eventObject.target.value) {
                    this.$socket.emit('message', { message: eventObject.target.value }, (response) => {
                        this.printMessage(response);
                    });

                    eventObject.target.value = '';
                }
            },

            printMessage(message) {
                if (!message.hasOwnProperty('message')) { return; }

                if (!message.hasOwnProperty('user')){
                    this.socketMessages.push(message.message);
                    return;
                }

                this.socketMessages.push(`${message.user} : ${message.message}`);
            }

        },

        created(){
            this.$socket.emit('messages_load');
        }
    }

</script>

<style scoped>
    .message {
        width: 170px;
        min-height: 30px;
        background-color: darkturquoise;
        border-radius: 5px;
        margin: 7px
    }
</style>