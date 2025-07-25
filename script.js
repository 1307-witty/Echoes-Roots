
// Global variables
let familyMembers = [];
let currentView = 'tree';
let currentStep = 1;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingTimer = null;
let recordingStartTime = 0;
let selectedMember = null;

// Initialize the app
function startApp() {

    const splash = document.getElementById('splash');
    const main = document.getElementById('main');

    // Add transition effect
    splash.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    splash.style.opacity = '0';
    splash.style.transform = 'scale(0.95)';

    setTimeout(() => {
        splash.classList.add('hidden');
        main.classList.remove('hidden');
        initializeApp();
    }, 800);
}

function initializeApp() {
    // 💣 BOOM! Clears saved famil
    loadFamilyData();
    setupEventListeners();
    updateStats();
    renderGallery();
    renderFamilyTree();
    loadYourProfile();
    loadSettings();
}

// Load and save your own profile


function setupEventListeners() {
    // Photo upload events
    const photoUpload = document.getElementById('photoUpload');
    const photoInput = document.getElementById('photoInput');

    if (photoUpload && photoInput) {
        photoUpload.addEventListener('click', () => photoInput.click());
        photoUpload.addEventListener('dragover', handleDragOver);
        photoUpload.addEventListener('drop', handleDrop);
        photoInput.addEventListener('change', handlePhotoSelect);
    }

    // Form navigation
    const form = document.getElementById('memberForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveMember();
        });
    }

    // Close modal on background click
    const modal = document.getElementById('memberModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeMemberModal();
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMemberModal();
        }
    });
}

// Navigation functions
function switchView(viewName) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected view and activate nav item
    const targetView = document.getElementById(viewName + '-view');
    const targetNav = document.querySelector(`[data-view="${viewName}"]`);

    if (targetView && targetNav) {
        targetView.classList.add('active');
        targetNav.classList.add('active');
        currentView = viewName;

        // Load view-specific content
        if (viewName === 'gallery') {
            renderGallery();
        } else if (viewName === 'tree') {
            updateStats();
        }
    }
}

// Form step navigation
function nextStep() {
    const currentStepEl = document.getElementById(`step${currentStep}`);
    const nextStepEl = document.getElementById(`step${currentStep + 1}`);

    if (currentStepEl && nextStepEl) {
        currentStepEl.classList.remove('active');
        nextStepEl.classList.add('active');
        currentStep++;
    }
}

function prevStep() {
    const currentStepEl = document.getElementById(`step${currentStep}`);
    const prevStepEl = document.getElementById(`step${currentStep - 1}`);

    if (currentStepEl && prevStepEl) {
        currentStepEl.classList.remove('active');
        prevStepEl.classList.add('active');
        currentStep--;
    }
}

// Photo upload functions
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.style.borderColor = '';
    e.currentTarget.style.background = '';

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handlePhotoFile(files[0]);
    }
}

function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handlePhotoFile(file);
    }
}

function handlePhotoFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadContent = document.querySelector('.upload-content');
        const preview = document.getElementById('photoPreview');
        const previewImg = document.getElementById('previewImage');

        if (uploadContent && preview && previewImg) {
            uploadContent.style.display = 'none';
            preview.classList.remove('hidden');
            previewImg.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    const uploadContent = document.querySelector('.upload-content');
    const preview = document.getElementById('photoPreview');
    const previewImg = document.getElementById('previewImage');
    const photoInput = document.getElementById('photoInput');

    if (uploadContent && preview && previewImg && photoInput) {
        uploadContent.style.display = 'block';
        preview.classList.add('hidden');
        previewImg.src = '';
        photoInput.value = '';
    }
}

// Voice recording functions
async function toggleRecording() {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);

            const audioPreview = document.getElementById('audioPreview');
            const recordedAudio = document.getElementById('recordedAudio');

            if (audioPreview && recordedAudio) {
                recordedAudio.src = audioUrl;
                audioPreview.classList.remove('hidden');
            }
        });

        mediaRecorder.start();
        isRecording = true;

        // Update UI
        const recordBtn = document.getElementById('recordBtn');
        const waveform = document.querySelector('.waveform');

        if (recordBtn) {
            recordBtn.classList.add('recording');
            recordBtn.querySelector('.record-text').textContent = 'Recording...';
        }

        if (waveform) {
            waveform.style.opacity = '1';
        }

        // Start timer
        recordingStartTime = Date.now();
        recordingTimer = setInterval(updateRecordingTime, 1000);

        // Animate wave bars
        document.querySelectorAll('.wave-bar').forEach(bar => {
            bar.style.background = '#ff6b6b';
            bar.style.animation = 'wave 0.5s infinite ease-in-out';
        });

    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Unable to access microphone. Please check permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;

        // Update UI
        const recordBtn = document.getElementById('recordBtn');
        const waveform = document.querySelector('.waveform');

        if (recordBtn) {
            recordBtn.classList.remove('recording');
            recordBtn.querySelector('.record-text').textContent = 'Start Recording';
        }

        if (waveform) {
            waveform.style.opacity = '0.3';
        }

        // Clear timer
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }

        // Reset wave bars
        document.querySelectorAll('.wave-bar').forEach(bar => {
            bar.style.background = 'rgba(255,255,255,0.3)';
            bar.style.animation = 'wave 1.5s infinite ease-in-out';
        });
    }
}

function updateRecordingTime() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const timeDisplay = document.getElementById('recordingTime');
    if (timeDisplay) {
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function removeAudio() {
    const audioPreview = document.getElementById('audioPreview');
    const recordedAudio = document.getElementById('recordedAudio');

    if (audioPreview && recordedAudio) {
        audioPreview.classList.add('hidden');
        recordedAudio.src = '';
    }
}


// Family member management
function loadFamilyData() {
    const saved = localStorage.getItem('familyMembers');
    if (saved) {
        try {
            familyMembers = JSON.parse(saved);
        } catch (error) {
            console.error('Error loading family data:', error);
            familyMembers = []; // just start empty
        }
    } else {
        familyMembers = []; // ✨ no defaults here
    }
}




function saveFamilyData() {
    try {
        localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
    } catch (error) {
        console.error('Error saving family data:', error);
    }
}

function saveMember() {
    const name = document.getElementById('memberName')?.value.trim();
    const relation = document.getElementById('memberRelation')?.value;
    const birthDate = document.getElementById('memberBirthDate')?.value;
    const bio = document.getElementById('memberBio')?.value.trim();

    if (!name || !relation) {
        alert('Please fill in the name and relationship fields.');
        return;
    }

    // Check for duplicate names (except when editing)
    const existingMember = familyMembers.find(m =>
        m.name.toLowerCase() === name.toLowerCase() &&
        (!window.editingMember || m.id !== window.editingMember.id)
    );

    if (existingMember) {
        alert(`A family member named "${name}" already exists. Please choose a different name.`);
        return;
    }

    const photoPreview = document.getElementById('previewImage');
    const audioPreview = document.getElementById('recordedAudio');

    const memberData = {
        name: name,
        relation: relation,
        birthDate: birthDate || null,
        bio: bio || '',
        photo: photoPreview?.src || null,
        audio: audioPreview?.src || null
    };

    if (window.editingMember) {
        // Update existing member
        const index = familyMembers.findIndex(m => m.id === window.editingMember.id);
        if (index !== -1) {
            familyMembers[index] = {
                id: window.editingMember.id, // Keep the original ID
                ...memberData
            };
            showNotification(`${name} updated successfully!`, 'success');
        }
        window.editingMember = null;
    } else {
        // Add new member - check for duplicates first
        const member = {
            id: Date.now(),
            ...memberData
        };
        familyMembers.push(member);
        showNotification(`${name} added to your family tree!`, 'success');
    }

    saveFamilyData();

    // Show success and reset form
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.textContent = '✅ Saved Successfully!';
        saveBtn.style.background = 'linear-gradient(135deg, #00b894, #00a085)';

        setTimeout(() => {
            resetForm();
            switchView('tree');
            renderFamilyTree();
        }, 1500);
    }

    updateStats();
    renderGallery();
    renderFamilyTree();
}

// New function to render the dynamic family tree
function renderFamilyTree() {
    const treeContainer = document.querySelector('.tree-container');
    if (!treeContainer) return;

    // FIND the manually added "You" node
    const youMember = familyMembers.find(m => m.relation?.toLowerCase() === 'you');

    // Group members by relationship (excluding 'you')
    const membersByRelation = {
    parents: familyMembers.filter(m => ['father', 'mother', 'parent'].includes(m.relation)),
    grandparents: familyMembers.filter(m => ['grandfather', 'grandmother', 'grandparent'].includes(m.relation)),
    siblings: familyMembers.filter(m => ['brother', 'sister', 'sibling'].includes(m.relation)),
    unclesAunts: familyMembers.filter(m => ['uncle', 'aunt'].includes(m.relation)),
    cousins: familyMembers.filter(m => ['cousin'].includes(m.relation)),
    children: familyMembers.filter(m => ['son', 'daughter', 'child'].includes(m.relation)),
    partners: familyMembers.filter(m => ['spouse', 'partner', 'father-in-law', 'mother-in-law'].includes(m.relation))



    };

    // Start building the tree HTML
    treeContainer.innerHTML = `
        ${youMember ? `
        <div class="tree-center">
            <div class="central-node" onclick="showMemberProfile('${youMember.name}')">
                <div class="node-photo">
                    ${youMember.photo ?
                `<img src="${youMember.photo}" alt="${youMember.name}" />` :
                `<div class="placeholder-photo">${getEmoji(youMember.relation)}</div>`}
                </div>
                <div class="node-info">
                    <h3>${youMember.name}</h3>
                    <p>${youMember.bio}</p>
                </div>
                <div class="node-pulse"></div>
            </div>
        </div>` : ''}

        ${membersByRelation.parents.length > 0 ? `
        <div class="tree-level parents">
            <h4 class="level-title">Parents</h4>
            <div class="level-members">
                ${membersByRelation.parents.map(member => `
                    <div class="tree-node parent" onclick="showMemberProfile('${member.name}')">
                        <div class="node-photo">
                            ${member.photo ?
                        `<img src="${member.photo}" alt="${member.name}" />` :
                        `<div class="placeholder-photo">${getEmoji(member.relation)}</div>`}
                        </div>
                        <h4>${member.name}</h4>
                        <p>${capitalizeFirst(member.relation)}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        ${membersByRelation.grandparents.length > 0 ? `
        <div class="tree-level grandparents">
            <h4 class="level-title">Grandparents</h4>
            <div class="level-members">
                ${membersByRelation.grandparents.map(member => `
                    <div class="tree-node grandparent" onclick="showMemberProfile('${member.name}')">
                        <div class="node-photo">
                            ${member.photo ?
                                `<img src="${member.photo}" alt="${member.name}" />` :
                                `<div class="placeholder-photo">${getEmoji(member.relation)}</div>`}
                        </div>
                        <h4>${member.name}</h4>
                        <p>${capitalizeFirst(member.relation)}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        ${membersByRelation.siblings.length > 0 ? `
        <div class="tree-level siblings">
            <h4 class="level-title">Siblings</h4>
            <div class="level-members">
                ${membersByRelation.siblings.map(member => `
                    <div class="tree-node sibling" onclick="showMemberProfile('${member.name}')">
                        <div class="node-photo">
                            ${member.photo ?
                                        `<img src="${member.photo}" alt="${member.name}" />` :
                                        `<div class="placeholder-photo">${getEmoji(member.relation)}</div>`}
                        </div>
                        <h4>${member.name}</h4>
                        <p>${capitalizeFirst(member.relation)}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        ${membersByRelation.unclesAunts.length > 0 ? `
        <div class="tree-level uncles-aunts">
            <h4 class="level-title">Uncles & Aunts</h4>
            <div class="level-members">
                ${membersByRelation.unclesAunts.map(member => `
                    <div class="tree-node uncle-aunt" onclick="showMemberProfile('${member.name}')">
                        <div class="node-photo">
                            ${member.photo ?
                                                `<img src="${member.photo}" alt="${member.name}" />` :
                                                `<div class="placeholder-photo">${getEmoji(member.relation)}</div>`}
                        </div>
                        <h4>${member.name}</h4>
                        <p>${capitalizeFirst(member.relation)}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        ${membersByRelation.cousins.length > 0 ? `
        <div class="tree-level cousins">
            <h4 class="level-title">Cousins</h4>
            <div class="level-members">
                ${membersByRelation.cousins.map(member => `
                    <div class="tree-node cousin" onclick="showMemberProfile('${member.name}')">
                        <div class="node-photo">
                            ${member.photo ?
                                                        `<img src="${member.photo}" alt="${member.name}" />` :
                                                        `<div class="placeholder-photo">${getEmoji(member.relation)}</div>`}
                        </div>
                        <h4>${member.name}</h4>
                        <p>${capitalizeFirst(member.relation)}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        ${membersByRelation.children.length > 0 ? `
        <div class="tree-level children">
            <h4 class="level-title">Children</h4>
            <div class="level-members">
                ${membersByRelation.children.map(member => `
                    <div class="tree-node child" onclick="showMemberProfile('${member.name}')">
                        <div class="node-photo">
                            ${member.photo ?
                                                                `<img src="${member.photo}" alt="${member.name}" />` :
                                                                `<div class="placeholder-photo">${getEmoji(member.relation)}</div>`}
                        </div>
                        <h4>${member.name}</h4>
                        <p>${capitalizeFirst(member.relation)}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
        ${membersByRelation.partners.length > 0 ? `
<div class="tree-level partners">
    <h4 class="level-title">Partners</h4>
    <div class="level-members">
        ${membersByRelation.partners.map(member => `
            <div class="tree-node partner" onclick="showMemberProfile('${member.name}')">
                <div class="node-photo">
                    ${member.photo ?
                        `<img src="${member.photo}" alt="${member.name}" />` :
                        `<div class="placeholder-photo">${getEmoji(member.relation)}</div>`}
                </div>
                <h4>${member.name}</h4>
                <p>${capitalizeFirst(member.relation)}</p>
            </div>
        `).join('')}
    </div>
</div>` : ''}

        
    `;
}

// To achieve what you described:
// - When the central "You" node is clicked
// - You want to open a **full-page editor** with photo, bio, and voice recording options

// Here's how you can modify your `showMemberProfile` function to do that for the "You" profile





// Helper functions
function getEmoji(relation) {
    const emojiMap = {
        'YOU': '👤',
        'father': '👨',
        'mother': '👩',
        'grandfather': '👴',
        'grandmother': '👵',
        'uncle': '👨',
        'aunt': '👩',
        'brother': '👦',
        'sister': '👧',
        'sibling': '🧑',
        'cousin': '🧑',
        'son': '👦',
        'daughter': '👧',
        'child': '🧒',
        'spouse':'💑' ,
        'partner':'💑', 
        'father-in-law':'👨', 
        'mother-in-law':'👩' 
    };
    return emojiMap[relation] || '👤';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function resetForm() {
    // Reset form fields
    const inputs = ['memberName', 'memberRelation', 'memberBirthDate', 'memberBio'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });

    // Reset photo
    removePhoto();

    // Reset audio
    removeAudio();

    // Reset to first step
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById('step1')?.classList.add('active');
    currentStep = 1;
}

// Member profile functions
function showMemberProfile(memberKey) {
    let member = familyMembers.find(m =>
        m.id === memberKey ||
        m.name.toLowerCase() === memberKey.toLowerCase()
    );

    if (!member) return;

    selectedMember = member;
    const modal = document.getElementById('memberModal');


    if (modal) {
        // Populate modal content
        const elements = {
            modalName: member.name,
            modalRelation: member.relation,
            modalBirth: member.birthDate ? new Date(member.birthDate).toLocaleDateString() : 'Not specified',
            modalBio: member.bio || 'No story available yet.'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Set photo
        const modalPhoto = document.getElementById('modalPhoto');
        if (modalPhoto) {
            modalPhoto.src = member.photo || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ddd"/><text x="50" y="50" text-anchor="middle" dy="0.3em" font-size="16" fill="%23999">No Photo</text></svg>';
        }

        // Handle voice button
        const playVoiceBtn = document.getElementById('playVoiceBtn');
        const memberAudio = document.getElementById('memberAudio');

        if (member.audio && memberAudio && playVoiceBtn) {
            memberAudio.src = member.audio;
            playVoiceBtn.style.display = 'flex';
        } else if (playVoiceBtn) {
            playVoiceBtn.style.display = 'none';
        }

        modal.classList.remove('hidden');
    }
}

function closeMemberModal() {
    const modal = document.getElementById('memberModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    selectedMember = null;
}

function playMemberVoice() {
    const audio = document.getElementById('memberAudio');
    const button = document.getElementById('playVoiceBtn');

    if (audio && button) {
        if (audio.paused) {
            audio.play();
            button.innerHTML = '<span class="btn-icon">⏸️</span><span>Pause</span>';

            audio.onended = () => {
                button.innerHTML = '<span class="btn-icon">🔊</span><span>Play Voice</span>';
            };
        } else {
            audio.pause();
            button.innerHTML = '<span class="btn-icon">🔊</span><span>Play Voice</span>';
        }
    }
}

function editMember() {
    if (!selectedMember || selectedMember.id === 'you') return;

    closeMemberModal();
    switchView('add');

    // Set editing mode
    window.editingMember = selectedMember;

    // Populate form with member data
    setTimeout(() => {
        const elements = {
            memberName: selectedMember.name,
            memberRelation: selectedMember.relation,
            memberBirthDate: selectedMember.birthDate,
            memberBio: selectedMember.bio
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) element.value = value;
        });

        if (selectedMember.photo) {
            const uploadContent = document.querySelector('.upload-content');
            const preview = document.getElementById('photoPreview');
            const previewImg = document.getElementById('previewImage');

            if (uploadContent && preview && previewImg) {
                uploadContent.style.display = 'none';
                preview.classList.remove('hidden');
                previewImg.src = selectedMember.photo;
            }
        }

        if (selectedMember.audio) {
            const audioPreview = document.getElementById('audioPreview');
            const recordedAudio = document.getElementById('recordedAudio');

            if (audioPreview && recordedAudio) {
                recordedAudio.src = selectedMember.audio;
                audioPreview.classList.remove('hidden');
            }
        }

        // Update form title for editing
        const stepHeader = document.querySelector('#step1 .step-header h3');
        if (stepHeader) {
            stepHeader.textContent = `Edit ${selectedMember.name}`;
        }

        // Update save button text
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Update Family Member';
        }
    }, 100);
}

function deleteMember() {
    if (!selectedMember || selectedMember.id === 'you') return;

    const memberName = selectedMember.name;
    const confirmed = confirm(`Are you sure you want to delete ${memberName} from your family tree? This action cannot be undone.`);

    if (confirmed) {
        // Remove from familyMembers array
        familyMembers = familyMembers.filter(member => member.id !== selectedMember.id);

        // Save updated data
        saveFamilyData();

        // Update UI
        updateStats();
        renderGallery();
        renderFamilyTree();

        // Close modal
        closeMemberModal();

        // Show success message
        showNotification(`${memberName} has been removed from your family tree.`, 'success');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function clearAllData() {
    const confirmed = confirm('Are you sure you want to clear all family data? This will delete all family members, photos, and voice recordings. This action cannot be undone.');

    if (confirmed) {
        const doubleConfirm = confirm('This will permanently delete everything. Are you absolutely sure?');

        if (doubleConfirm) {
            // Clear all data
            familyMembers = [];
            localStorage.removeItem('familyMembers');
            localStorage.removeItem('yourProfile');

            // Reset UI
            updateStats();
            renderGallery();
            renderFamilyTree();
            loadYourProfile();

            showNotification('All family data has been cleared.', 'info');
        }
    }
}

function exportFamilyData() {
    const data = {
        familyMembers: familyMembers,
        yourProfile: localStorage.getItem('yourProfile'),
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'echoes-roots-family-data.json';
    link.click();

    URL.revokeObjectURL(url);
    showNotification('Family data exported successfully!', 'success');
}

function importFamilyData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);

                    if (data.familyMembers) {
                        familyMembers = data.familyMembers;
                        saveFamilyData();
                    }

                    if (data.yourProfile) {
                        localStorage.setItem('yourProfile', data.yourProfile);
                    }

                    // Update UI
                    updateStats();
                    renderGallery();
                    renderFamilyTree();
                    loadYourProfile();

                    showNotification('Family data imported successfully!', 'success');
                } catch (error) {
                    showNotification('Error importing data. Please check the file format.', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Gallery and stats
function renderGallery() {
    const gallery = document.getElementById('galleryGrid');
    if (!gallery) return;

    if (familyMembers.length === 0) {
        gallery.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.7);">
                <h3>No family members yet</h3>
                <p>Start building your family tree by adding your first member!</p>
                <button onclick="switchView('add')" style="margin-top: 1rem; padding: 0.8rem 1.5rem; background: rgba(255,255,255,0.2); border: none; border-radius: 20px; color: white; cursor: pointer;">Add First Member</button>
            </div>
        `;
        return;
    }

    gallery.innerHTML = familyMembers.map(member => `
        <div class="gallery-item" onclick="showMemberProfile('${member.name}')">
            <img src="${member.photo || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ddd"/><text x="50" y="50" text-anchor="middle" dy="0.3em" font-size="16" fill="%23999">No Photo</text></svg>'}" alt="${member.name}" />
            <div class="gallery-item-info">
                <div class="gallery-item-name">${member.name}</div>
                <div class="gallery-item-relation">${member.relation}</div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const memberCount = document.getElementById('memberCount');
    const voiceCount = document.getElementById('voiceCount');
    const photoCount = document.getElementById('photoCount');

    if (memberCount) memberCount.textContent = familyMembers.length;
    if (voiceCount) voiceCount.textContent = familyMembers.filter(m => m.audio).length;
    if (photoCount) photoCount.textContent = familyMembers.filter(m => m.photo).length;
}

function updateTreeLayout() {
    const layout = document.getElementById('treeLayout').value;
    const treeContainer = document.querySelector('.tree-container');

    if (treeContainer) {
        treeContainer.className = `tree-container layout-${layout}`;
        localStorage.setItem('treeLayout', layout);
        showNotification(`Tree layout changed to ${layout}`, 'success');
    }
}

function updateColorTheme() {
    const theme = document.getElementById('colorTheme').value;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('colorTheme', theme);
    showNotification(`Color theme changed to ${theme}`, 'success');
}

function loadSettings() {
    const layout = localStorage.getItem('treeLayout') || 'vertical';
    const theme = localStorage.getItem('colorTheme') || 'default';

    const layoutSelect = document.getElementById('treeLayout');
    const themeSelect = document.getElementById('colorTheme');

    if (layoutSelect) layoutSelect.value = layout;
    if (themeSelect) themeSelect.value = theme;

    // Apply saved theme
    document.body.className = `theme-${theme}`;

    // Update storage info
    updateStorageInfo();
}

function updateStorageInfo() {
    const storageInfo = document.getElementById('storageInfo');
    const storageBadge = document.getElementById('storageBadge');

    if (storageInfo && storageBadge) {
        try {
            const data = JSON.stringify({
                familyMembers: familyMembers,
                yourProfile: localStorage.getItem('yourProfile')
            });

            const sizeInBytes = new Blob([data]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);

            storageInfo.textContent = `${sizeInKB} KB used`;

            if (sizeInKB < 100) {
                storageBadge.textContent = 'Light';
                storageBadge.style.background = 'linear-gradient(135deg, #00b894, #00a085)';
            } else if (sizeInKB < 500) {
                storageBadge.textContent = 'Medium';
                storageBadge.style.background = 'linear-gradient(135deg, #fdcb6e, #f39c12)';
            } else {
                storageBadge.textContent = 'Heavy';
                storageBadge.style.background = 'linear-gradient(135deg, #ff4757, #c44569)';
            }
        } catch (error) {
            storageInfo.textContent = 'Unable to calculate';
            storageBadge.textContent = 'Error';
        }
    }
}

function resetForm() {
    // Reset editing mode
    window.editingMember = null;

    // Reset form fields
    const inputs = ['memberName', 'memberRelation', 'memberBirthDate', 'memberBio'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });

    // Reset photo
    removePhoto();

    // Reset audio
    removeAudio();

    // Reset to first step
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById('step1')?.classList.add('active');
    currentStep = 1;

    // Reset form title
    const stepHeader = document.querySelector('#step1 .step-header h3');
    if (stepHeader) {
        stepHeader.textContent = 'Basic Information';
    }

    // Reset save button text
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.textContent = 'Save to Family Tree';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Echoes & Roots app initialized');
    loadSettings();
});

