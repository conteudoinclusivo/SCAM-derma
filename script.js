document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO DO FIREBASE ---
     // Web app's Firebase configuration
     // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDmH117wqLvvP6cQT_uGDUrTfHW3z0a20o",
    authDomain: "scam-dermatologia.firebaseapp.com",
    projectId: "scam-dermatologia",
    storageBucket: "scam-dermatologia.firebasestorage.app",
    messagingSenderId: "703070520276",
    appId: "1:703070520276:web:0c906d8b94988448d34c41",
    measurementId: "G-V44NXQ2H48"
  };

    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // --- ELEMENTOS DA DOM ---
    const views = document.querySelectorAll('.view');
    const navItems = document.querySelectorAll('.nav-item');
    const actionCards = document.querySelectorAll('.action-card');
    const backButtons = document.querySelectorAll('.back-button');
    const loader = document.getElementById('loader');

    // --- NAVEGAÇÃO ---
    function switchView(viewId) {
        views.forEach(view => view.classList.remove('active'));
        document.getElementById(viewId)?.classList.add('active');
        
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.target === viewId);
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(item.dataset.target);
        });
    });

    actionCards.forEach(card => {
        card.addEventListener('click', () => switchView(card.dataset.target));
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => switchView('dashboard-view'));
    });

    // --- LÓGICA DO DASHBOARD ---
    async function loadDashboardData() {
        loader.classList.remove('hidden');
        await loadVencimentos();
        // await loadLembretes(); // Implementar se necessário
        loader.classList.add('hidden');
    }

    async function loadVencimentos() {
        const list = document.getElementById('vencimentos-list');
        list.innerHTML = '';
        
        const hoje = new Date();
        const limite = new Date();
        limite.setDate(hoje.getDate() + 90); // Vencimentos nos próximos 90 dias

        const snapshot = await db.collection('estoque')
            .where('dataValidade', '>=', hoje)
            .where('dataValidade', '<=', limite)
            .orderBy('dataValidade')
            .limit(5)
            .get();

        if (snapshot.empty) {
            list.innerHTML = '<p>Nenhuma amostra com vencimento próximo.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const item = doc.data();
            const dataValidade = item.dataValidade.toDate();
            const html = `
                <div class="list-item">
                    <div class="icon"><i class="ph-calendar"></i></div>
                    <div class="list-item-content">
                        <p>${item.nomeRemedio}</p>
                        <span>Vence em ${dataValidade.toLocaleDateString()}</span>
                    </div>
                </div>
            `;
            list.innerHTML += html;
        });
    }
    
    // --- LÓGICA DO FORMULÁRIO DE RECEBIMENTO ---
    const formReceber = document.getElementById('form-receber');
    formReceber.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.classList.remove('hidden');

        const tipoBtn = formReceber.querySelector('.toggle-btn.active');
        const dataValidade = document.getElementById('receber-validade').value;

        const novoItem = {
            nomeRemedio: document.getElementById('receber-remedio').value,
            substancia: document.getElementById('receber-substancia').value,
            tipo: tipoBtn ? tipoBtn.dataset.value : 'Amostra',
            categoria: document.getElementById('receber-categoria').value,
            laboratorio: document.getElementById('receber-laboratorio').value,
            representante: document.getElementById('receber-representante').value,
            quantidade: parseInt(document.getElementById('receber-quantidade').value),
            dataValidade: firebase.firestore.Timestamp.fromDate(new Date(dataValidade)),
            dataEntrada: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = await db.collection('estoque').add(novoItem);
            
            await db.collection('movimentacoes').add({
                tipo: 'Entrada',
                estoqueId: docRef.id,
                nomeRemedio: novoItem.nomeRemedio,
                quantidade: novoItem.quantidade,
                data: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Amostra recebida com sucesso!');
            formReceber.reset();
            switchView('dashboard-view');
            loadDashboardData();
        } catch (error) {
            console.error("Erro ao adicionar amostra:", error);
            alert('Ocorreu um erro. Tente novamente.');
        } finally {
            loader.classList.add('hidden');
        }
    });

    // --- INICIALIZAÇÃO ---
    // Lógica para alternar botões de tipo
    document.querySelectorAll('.form-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.querySelector('.active').classList.remove('active');
            btn.classList.add('active');
        })
    });
    
    // Lógica para o switch de lembrete
    const agendarLembreteSwitch = document.getElementById('agendar-lembrete');
    const lembreteFields = document.getElementById('lembrete-fields');
    agendarLembreteSwitch.addEventListener('change', () => {
        lembreteFields.classList.toggle('hidden', !agendarLembreteSwitch.checked);
    });

    // Carrega os dados iniciais do dashboard
    loadDashboardData();
});
