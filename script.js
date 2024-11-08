const API_URL = 'https://redirecting-api.aa4530607.workers.dev';
const REDIRECT_URL = 'https://starluxy-splite.aa4530607.workers.dev';
let deleteId = null;

function debug(message) {
    const debug = document.getElementById('debug');
    debug.style.display = 'block';
    debug.innerHTML += `${new Date().toISOString()}: ${message}<br>`;
    debug.scrollTop = debug.scrollHeight;
}

function showMessage(type, text) {
    const msg = document.getElementById(`${type}Message`);
    msg.textContent = text;
    msg.className = `message ${text.includes('Error') ? 'error' : 'success'}`;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
}

async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const campaignId = Math.random().toString(36).slice(2, 10);
    
    const data = {
        campaignId,
        name: form.name.value,
        description: form.description.value,
        url1: form.url1.value,
        url2: form.url2.value
    };

    debug(`Submitting data: ${JSON.stringify(data)}`);

    try {
        const response = await fetch(`${API_URL}/save-campaign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        debug(`Save response: ${JSON.stringify(result)}`);

        if (response.ok) {
            form.reset();
            showMessage('create', 'Split URL created successfully!');
            loadUrls();
        } else {
            showMessage('create', `Error: ${result.error}`);
        }
    } catch (err) {
        debug(`Save error: ${err.message}`);
        showMessage('create', 'Error creating split URL');
    }
}

function createUrlItem(campaign) {
    const item = document.createElement('div');
    item.className = 'url-item';
    
    const splitUrl = `${REDIRECT_URL}/${campaign.id}`;
    
    item.innerHTML = `
        <div class="url-header">
            <span>${campaign.name}</span>
            <div>
                <i class="fas fa-plus toggle-btn"></i>
                <i class="fas fa-trash delete-btn" onclick="confirmDelete('${campaign.id}')"></i>
            </div>
        </div>
        <div class="url-content">
            <p><strong>Split URL:</strong> ${splitUrl}
                <button onclick="copyToClipboard('${splitUrl}')" style="margin-left: 10px;">Copy</button>
            </p>
            ${campaign.description ? `<p><strong>Description:</strong> ${campaign.description}</p>` : ''}
            <p><strong>URL 1:</strong> ${campaign.url1}</p>
            <p><strong>URL 2:</strong> ${campaign.url2}</p>
        </div>
    `;

    const toggleBtn = item.querySelector('.toggle-btn');
    const content = item.querySelector('.url-content');
    
    toggleBtn.onclick = () => {
        content.classList.toggle('active');
        toggleBtn.classList.toggle('fa-plus');
        toggleBtn.classList.toggle('fa-minus');
    };

    return item;
}

async function loadUrls() {
    debug('Loading URLs...');
    try {
        const response = await fetch(`${API_URL}/list-campaigns`);
        const data = await response.json();
        debug(`Load response: ${JSON.stringify(data)}`);

        const list = document.getElementById('urlList');
        list.innerHTML = '';

        if (response.ok && Array.isArray(data)) {
            data.forEach(campaign => list.appendChild(createUrlItem(campaign)));
            if (data.length === 0) {
                list.innerHTML = '<p style="color: var(--text-secondary);">No split URLs created yet.</p>';
            }
        } else {
            showMessage('list', 'Error loading URLs');
        }
    } catch (err) {
        debug(`Load error: ${err.message}`);
        showMessage('list', 'Error loading URLs');
    }
}

function confirmDelete(id) {
    deleteId = id;
    toggleModal(true);
}

async function deleteCampaign() {
    debug(`Deleting campaign: ${deleteId}`);
    try {
        const response = await fetch(`${API_URL}/delete-campaign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: deleteId })
        });

        const result = await response.json();
        debug(`Delete response: ${JSON.stringify(result)}`);

        if (response.ok) {
            showMessage('list', 'Split URL deleted successfully');
            loadUrls();
        } else {
            showMessage('list', `Error: ${result.error}`);
        }
    } catch (err) {
        debug(`Delete error: ${err.message}`);
        showMessage('list', 'Error deleting split URL');
    }
    toggleModal(false);
    deleteId = null;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showMessage('list', 'URL copied to clipboard!');
    } catch (err) {
        showMessage('list', 'Failed to copy URL');
    }
}

function toggleModal(show) {
    document.getElementById('deleteModal').classList.toggle('active', show);
}

// Initialize
document.getElementById('urlForm').onsubmit = handleSubmit;
document.getElementById('confirmDelete').onclick = deleteCampaign;

// Add debug toggle
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'd') {
        const debug = document.getElementById('debug');
        debug.style.display = debug.style.display === 'none' ? 'block' : 'none';
    }
});

// Load URLs on page load
loadUrls();
