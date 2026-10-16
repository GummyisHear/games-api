const vue = Vue.createApp({
    data() {
        return {
            gameInModal: { name: null },
            games: [],
            gameInForm: {id: null, name: '', price: null},
            formError: null,
            gameToDelete: {name: null},
            currentUser: localStorage.getItem('username') || null,
            currentRole: localStorage.getItem('role') || null,
            token: localStorage.getItem('token') || null,
            authForm: {username: '', password: ''},
            authError: null,
            isLoginMode: true
        }
    }, async created() {
        this.games = await (await fetch('http://localhost:8080/games')).json();
    },
    methods: {
        getGame: async function (id) {
            this.gameInModal = await (await fetch(`http://localhost:8080/games/${id}`)).json();
            let gameInfoModal = new bootstrap.Modal(document.getElementById('gameInfoModal'));
            gameInfoModal.show();
        },
        openDeleteModal(game) {
            this.gameToDelete = game
            bootstrap.Modal.getOrCreateInstance(document.getElementById('gameDeleteModal')).show()
        },
        deleteGame: async function () {
            const id = this.gameToDelete.id
            const response = await fetch(`http://localhost:8080/games/${id}`, {
                method: 'DELETE',
                headers: {'Authorization': `Bearer ${this.token}`}
            })

            if (response.status === 204) {
                this.games = this.games.filter(game => game.id !== id)
            }
            bootstrap.Modal.getInstance(document.getElementById('gameDeleteModal')).hide()
        },
        openAddModal() {
            this.gameInForm = {id: null, name: '', price: null}
            this.formError = null
            bootstrap.Modal.getOrCreateInstance(document.getElementById('gameFormModal')).show()
        },
        openEditModal(game) {
            this.gameInForm = {...game}
            this.formError = null
            bootstrap.Modal.getOrCreateInstance(document.getElementById('gameFormModal')).show()
        },
        saveGame: async function () {
            const form = this.gameInForm
            if (!form.name || form.price === null || form.price === '') {
                this.formError = 'Please fill in both name and price.'
                return
            }

            const isEdit = form.id !== null
            const response = await fetch(isEdit ? `http://localhost:8080/games/${form.id}` : 'http://localhost:8080/games', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({name: form.name, price: form.price})
            })

            if (!response.ok) {
                this.formError = (await response.json()).error
                return
            }

            const game = await response.json()
            if (isEdit) {
                this.games = this.games.map(g => g.id === game.id ? game : g)
            } else {
                this.games.push(game)
            }
            bootstrap.Modal.getInstance(document.getElementById('gameFormModal')).hide()
        },
        openAuthModal() {
            this.authForm = {username: '', password: ''}
            this.authError = null
            this.isLoginMode = true
            bootstrap.Modal.getOrCreateInstance(document.getElementById('authModal')).show()
        },
        toggleAuthMode() {
            this.isLoginMode = !this.isLoginMode
            this.authError = null
        },
        submitAuth() {
            if (this.isLoginMode) {
                this.login()
            } else {
                this.register()
            }
        },
        async login() {
            const response = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(this.authForm)
            })
            if (!response.ok) {
                this.authError = (await response.json()).error
                return
            }
            const data = await response.json()
            this.token = data.token
            this.currentUser = data.username
            this.currentRole = data.role
            localStorage.setItem('token', data.token)
            localStorage.setItem('username', data.username)
            localStorage.setItem('role', data.role)
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide()
        },
        async register() {
            const response = await fetch('http://localhost:8080/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(this.authForm)
            })
            if (!response.ok) {
                this.authError = (await response.json()).error
                return
            }
            // Auto login or switch to login mode after successful registration
            this.isLoginMode = true
            this.authError = null
            alert('Registration successful! Please log in.')
        },
        logout() {
            this.token = null
            this.currentUser = null
            this.currentRole = null
            localStorage.clear()
        }
    }
}).mount('#app')