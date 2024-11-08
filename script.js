let authToken = localStorage.getItem('authToken');
const API_URL = 'https://redirecting-api.aa4530607.workers.dev';
const REDIRECT_URL = 'https://starluxy-splite.aa4530607.workers.dev';
let deleteId = null;

async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        }
    });
    if (!response.ok) throw new Error('API failed');
    return response.json();
}

function toggleModal(show) {
    document.getElementById('deleteModal').classList.toggle('active', show);
}

function login(password) {
    authToken = password;
    localStorage.setItem('authToken', authToken);
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    loadUrls();
}

function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
}

async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const url1 = form.url1.value;
    const url2 = form.url2.value;

    // Check if URLs are different
    if (url1 === url2) {
        return;
    }

    const data = {
        campaignId: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: form.name.value,
        url1: url1,
        url2: url2,
        description: form.description.value
    };

    try {
        await apiCall('/save-campaign', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        form.reset();
        
        const urlList = document.getElementById('urlList');
        if (urlList.firstChild?.tagName === 'P') {
            urlList.innerHTML = '';
        }
        const newItem = createUrlItem({
            id: data.campaignId,
            ...data
        });
        urlList.insertBefore(newItem, urlList.firstChild);
    } catch (err) {
        console.error(err);
    }
}

function createUrlItem(campaign) {
    const item = document.createElement('div');
    item.className = 'url-item';
    item.dataset.id = campaign.id;
    
    item.innerHTML = `
        <div class="url-header">
            <span>${campaign.name}</span>
            <div>
                <i class="fas fa-plus toggle-btn"></i>
                <i class="fas fa-trash delete-btn"></i>
            </div>
        </div>
        <div class="url-content">
            <p>
                <strong>Split URL:</strong> 
                ${REDIRECT_URL}/${campaign.id}
                <button onclick="navigator.clipboard.writeText('${REDIRECT_URL}/${campaign.id}')">Copy</button>
            </p>
            ${campaign.description ? `<p><strong>Description:</strong> ${campaign.description}</p>` : ''}
            <p><strong>URL 1:</strong> ${campaign.url1}</p>
            <p><strong>URL 2:</strong> ${campaign.url2}</p>
        </div>
    `;

    item.querySelector('.toggle-btn').onclick = (e) => {
        item.querySelector('.url-content').classList.toggle('active');
        e.target.classList.toggle('fa-plus');
        e.target.classList.toggle('fa-minus');
    };

    item.querySelector('.delete-btn').onclick = () => {
        deleteId = campaign.id;
        toggleModal(true);
    };

    return item;
}

async function loadUrls() {
    try {
        const data = await apiCall('/list-campaigns');
        const list = document.getElementById('urlList');
        list.innerHTML = '';
        
        const sortedData = data.sort((a, b) => b.id.localeCompare(a.id));
        
        if (sortedData.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary);">No split URLs created yet.</p>';
        } else {
            sortedData.forEach(campaign => list.appendChild(createUrlItem(campaign)));
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteCampaign() {
    if (!deleteId) return;
    
    try {
        await apiCall('/delete-campaign', {
            method: 'POST',
            body: JSON.stringify({ campaignId: deleteId })
        });

        const itemToRemove = document.querySelector(`[data-id="${deleteId}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
            
            const list = document.getElementById('urlList');
            if (!list.children.length) {
                list.innerHTML = '<p style="color: var(--text-secondary);">No split URLs created yet.</p>';
            }
        }
    } catch (err) {
        console.error(err);
    }
    
    toggleModal(false);
    deleteId = null;
}

// URL validation
document.getElementById('urlForm').addEventListener('input', function(e) {
    const url1 = this.url1.value;
    const url2 = this.url2.value;
    this.querySelector('button[type="submit"]').disabled = url1 === url2;
});

// Initialize
document.getElementById('urlForm').onsubmit = handleSubmit;
document.getElementById('confirmDelete').onclick = deleteCampaign;
document.getElementById('loginForm').onsubmit = (e) => {
    e.preventDefault();
    login(document.getElementById('password').value);
};

if (authToken) {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    loadUrls();
} else {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
}
