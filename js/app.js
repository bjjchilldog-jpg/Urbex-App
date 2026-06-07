// --- INSTRUCTOR MODE VARIABLES & TRIGGERS ---
    let instructorHoldTimer;
    let randomBeeperActive = false;
    let strobeLockActive = false;

    function startInstructorHold(e) {
        // e.preventDefault() can block scrolling on mobile, so we let it be for SVG, but prevent default image dragging if it was an image
        instructorHoldTimer = setTimeout(() => {
            document.getElementById('instructorMenu').style.display = 'block';
            if("vibrate" in navigator) navigator.vibrate([100, 50, 100]); // Haptic feedback that menu opened
        }, 5000);
    }

    function endInstructorHold(e) {
        clearTimeout(instructorHoldTimer);
    }

    function toggleRandomBeeper() {
        randomBeeperActive = !randomBeeperActive;
        const btn = document.getElementById('btn-rand-beep');
        if(randomBeeperActive) {
            btn.innerText = "DRILL: RANDOM BEEPER (AN)";
            btn.style.backgroundColor = "#f39c12";
            btn.style.color = "#000";
        } else {
            btn.innerText = "DRILL: RANDOM BEEPER (AUS)";
            btn.style.backgroundColor = "transparent";
            btn.style.color = "#f39c12";
        }
    }

    function toggleStrobeLock() {
        strobeLockActive = !strobeLockActive;
        const btn = document.getElementById('btn-strobe-lock');
        if(strobeLockActive) {
            btn.innerText = "DRILL: STROBE MATH LOCK (AN)";
            btn.style.backgroundColor = "#3498db";
            btn.style.color = "#fff";
        } else {
            btn.innerText = "DRILL: STROBE MATH LOCK (AUS)";
            btn.style.backgroundColor = "transparent";
            btn.style.color = "#3498db";
        }
    }

    // --- INSTRUCTOR FAKE CRASH ---
    let crashClicks = 0;
    let crashClickTimer;
    let crashTimeout;

    function unlockFakeCrash(e) {
        e.stopPropagation();
        crashClicks++;
        clearTimeout(crashClickTimer);
        if(crashClicks >= 3) {
            document.getElementById('fakeCrashScreen').style.display = 'none';
            crashClicks = 0;
        } else {
            crashClickTimer = setTimeout(() => { crashClicks = 0; }, 1000);
        }
    }

    function triggerFakeCrash() {
        document.getElementById('instructorMenu').style.display = 'none';
        document.getElementById('fakeCrashScreen').style.display = 'flex';
        // Vibrate to simulate sudden shutdown
        if("vibrate" in navigator) navigator.vibrate(800);
    }

    function startFakeCrashCountdown() {
        alert("CRASH SCHARFGEMACHT!\n\nDas System wird in exakt 3 Minuten abstürzen. Denk an den 3-fach-Klick oben rechts zum Entsperren.");
        document.getElementById('instructorMenu').style.display = 'none';
        clearTimeout(crashTimeout);
        crashTimeout = setTimeout(triggerFakeCrash, 180000); // 3 minutes
    }


    // --- NAVIGATION ---
    function switchView(id) {
        var views = document.querySelectorAll('.view');
        for (var i = 0; i < views.length; i++) { views[i].classList.remove('active'); }
        document.getElementById(id).classList.add('active');
        if(id !== 'view-breath' && isRunning) toggleBreathing();
        if(id === 'view-intel') checkGoNoGo();
        if(id === 'view-aar') loadAAR();
        if(id === 'view-tasks') loadTasks();
    }

    function toggleIntelSections() {
        var hasInfo = document.getElementById('hasInfo').value;
        document.getElementById('intelSections').style.display = (hasInfo === 'ja') ? 'block' : 'none';
        checkGoNoGo();
    }

    // --- MANIFEST ---
    function loadManifestTemplate() {
        var pax = document.getElementById('paxCount').value;
        var text = "";
        for(var i=1; i<=pax; i++) {
            text += i + ". Name: \n   M/W/D: \n   Alter: \n   Blutgruppe: \n   Allergien/Meds: \n\n";
        }
        document.getElementById('medInfo').value = text;
    }

    function shareManifest() {
        var pax = document.getElementById('paxCount').value;
        var medInfo = document.getElementById('medInfo').value;
        
        if(medInfo.trim() === "") {
            return alert("Bitte erst die Infos ausfüllen!");
        }

        var msg = "🚑 *TEAM-INFO (I.C.E.)* 🚑\n\n" +
                  "Gruppengröße: " + pax + "\n" +
                  "Letzter Standort: " + globalLastGPSLink + "\n\n" +
                  "*Medizinische Daten:*\n" + medInfo + "\n" +
                  "_Diese Daten dienen im Notfall als Backup, falls Handys gesperrt oder beschädigt sind._";
        
        var encodedMsg = encodeURIComponent(msg);
        window.open("https://wa.me/?text=" + encodedMsg, "_blank");
    }

    // --- GPS ---
    var globalLastGPSLink = "Noch nicht ermittelt (Bitte in der Tour-Planung abrufen!)";
    function getGPS() {
        var display = document.getElementById('gpsDisplay');
        if (window.location.protocol === 'file:') {
            alert("⚠️ GPS BLOCKIERT:\nBrowser blockieren GPS bei lokalen Dateien. Sobald die App auf der Website liegt, geht es!");
            return;
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                var lat = pos.coords.latitude.toFixed(5); var lon = pos.coords.longitude.toFixed(5);
                var mapLink = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lon;
                globalLastGPSLink = mapLink;
                try { navigator.clipboard.writeText(mapLink); display.innerText = "GPS KOPIERT: " + lat + ", " + lon; } catch(e) { display.innerHTML = "<a href='" + mapLink + "' target='_blank' style='color:#27ae60;'>GPS LINK ÖFFNEN</a>"; }
            }, function(error) { alert("GPS Zugriff fehlgeschlagen."); });
        }
    }

    // --- TIMER & AWARENESS BEEPER (MODIFIED FOR RANDOM DRILL) ---
    var timerInt; 
    var endTime = 0;
    var startTime = 0;
    var nextBeep = 0;
    
    function startTimer() { 
        var h = parseInt(document.getElementById('t-hours').value)||0; 
        var m = parseInt(document.getElementById('t-mins').value)||0; 
        var totalDuration = (h*3600)+(m*60); 
        
        if(totalDuration <= 0) return; 
        
        document.getElementById('btnTimerStart').style.display = 'none'; 
        document.getElementById('btnTimerStop').style.display = 'block'; 
        
        startTime = Date.now();
        endTime = startTime + (totalDuration * 1000);
        
        // Initial setup for the next beep
        if(randomBeeperActive) {
            nextBeep = startTime + (Math.floor(Math.random() * 60000) + 30000); // 30s to 90s
        } else {
            nextBeep = startTime + 1200000; // Standard 20 Minutes
        }
        
        clearInterval(timerInt); 
        updateTimerDisplay(totalDuration); 
        
        timerInt = setInterval(function() { 
            var now = Date.now();
            var remaining = Math.round((endTime - now) / 1000);
            
            if (remaining >= 0) {
                updateTimerDisplay(remaining); 
            }
            
            // Awareness Beeper Logic (Supports normal 20m or Random Drill)
            if(document.getElementById('awarenessBeeper').checked && now >= nextBeep) {
                if("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
                
                // Calculate NEXT beep
                if(randomBeeperActive) {
                    nextBeep = now + (Math.floor(Math.random() * 60000) + 30000); // Random 30s to 90s
                } else {
                    nextBeep = now + 1200000; // Next normal Beep in 20 minutes
                }
            }

            if(remaining <= 0) { 
                clearInterval(timerInt); 
                triggerAlarm(); 
            } 
        }, 1000); 
    }
    
    function stopTimer() { 
        clearInterval(timerInt); 
        document.getElementById('btnTimerStart').style.display = 'block'; 
        document.getElementById('btnTimerStop').style.display = 'none'; 
        document.getElementById('timerDisplay').innerText = "BEENDET"; 
        document.getElementById('timerDisplay').style.color = "#f39c12"; 
    }
    
    function updateTimerDisplay(secs) { 
        if(secs < 0) secs = 0;
        var h = Math.floor(secs / 3600); 
        var m = Math.floor((secs % 3600) / 60); 
        var s = secs % 60; 
        document.getElementById('timerDisplay').innerText = String(h).padStart(2,'0')+":"+String(m).padStart(2,'0')+":"+String(s).padStart(2,'0'); 
    }
    
    function triggerAlarm() { 
        document.getElementById('timerDisplay').innerText = "🚨 ZEIT UM 🚨"; 
        document.getElementById('timerDisplay').style.color = "#c0392b"; 
        if("vibrate" in navigator) navigator.vibrate([500,200,500,200,500,500,1000]); 
        alert("GEPLANTE ZEIT IST ABGELAUFEN!"); 
    }

    function sendTotmannBriefing() {
        var h = document.getElementById('t-hours').value || 0; 
        var m = document.getElementById('t-mins').value || 0;
        var timeStr = String(h).padStart(2, '0') + ":" + String(m).padStart(2, '0');
        var msg = "🚨 *TOUR START* 🚨\n\nSteige jetzt ein.\nGeplante Dauer: *" + timeStr + " Stunden*.\n\nMein letzter Standort:\n" + globalLastGPSLink + "\n\nWenn ich mich nach Ablauf der Zeit nicht safe zurückmelde, versuch mich zu erreichen. Wenn das scheitert -> Hilfe organisieren!";
        window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
    }

    // --- AAR LOGBUCH ---
    var currentPhotoData = null;
    function previewPhoto(event) { var file = event.target.files[0]; if(!file) return; var reader = new FileReader(); reader.onload = function(e) { var img = new Image(); img.onload = function() { var canvas = document.createElement('canvas'); var scale = Math.min(600 / img.width, 1); canvas.width = img.width * scale; canvas.height = img.height * scale; canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); currentPhotoData = canvas.toDataURL('image/jpeg', 0.7); document.getElementById('aarPhotoPreview').src = currentPhotoData; document.getElementById('aarPhotoPreview').style.display = 'block'; }; img.src = e.target.result; }; reader.readAsDataURL(file); }
    
    function saveAAR() { 
        var input = document.getElementById('aarInput').value; 
        if(input.trim() === "" && !currentPhotoData) return; 
        var logs = JSON.parse(localStorage.getItem('urbexLogs') || "[]"); 
        logs.unshift({ id: Date.now(), date: new Date().toLocaleString('de-DE'), text: input, image: currentPhotoData }); 
        
        try {
            localStorage.setItem('urbexLogs', JSON.stringify(logs)); 
        } catch (e) {
            alert("❌ SPEICHER VOLL! Bitte lösche alte Einträge oder führe einen Export durch, um Platz für neue Notizen/Fotos zu schaffen.");
            return;
        }

        document.getElementById('aarInput').value = ""; 
        document.getElementById('aarPhotoPreview').style.display = "none"; 
        document.getElementById('aarPhotoInput').value = ""; 
        currentPhotoData = null; 
        loadAAR(); 
    }
    
    function loadAAR() { 
        var logs = JSON.parse(localStorage.getItem('urbexLogs') || "[]"); 
        var html = ""; 
        for(var i = 0; i < logs.length; i++) { 
            var logId = logs[i].id || i; 
            var imgHtml = logs[i].image ? "<img src='" + logs[i].image + "' class='log-img'>" : ""; 
            html += "<div class='log-entry'><div class='log-date'>" + logs[i].date + "</div><div style='margin-bottom: 8px;'>" + logs[i].text + "</div>" + imgHtml + "<div style='margin-top:10px;'><button class='btn-sm-cal' onclick='editAAR(" + logId + ")'>✏️</button><button class='btn-sm-del' onclick='deleteAAR(" + logId + ")'>🗑️</button><button class='btn-sm-share' onclick='shareAAR(" + logId + ")'>📤 TEILEN</button></div></div>"; 
        } 
        if(logs.length === 0) html = "<p style='color:#888; font-size:12px;'>Noch keine Einträge.</p>"; 
        document.getElementById('aarList').innerHTML = html; 
    }
    
    function deleteAAR(id) { if(!confirm("Eintrag wirklich löschen?")) return; var logs = JSON.parse(localStorage.getItem('urbexLogs') || "[]"); logs = logs.filter(function(l, index) { return (l.id || index) !== id; }); localStorage.setItem('urbexLogs', JSON.stringify(logs)); loadAAR(); }
    function editAAR(id) { var logs = JSON.parse(localStorage.getItem('urbexLogs') || "[]"); var logIndex = logs.findIndex(function(l, index) { return (l.id || index) === id; }); if(logIndex > -1) { var neuerText = prompt("Eintrag bearbeiten:", logs[logIndex].text); if(neuerText !== null) { logs[logIndex].text = neuerText; localStorage.setItem('urbexLogs', JSON.stringify(logs)); loadAAR(); } } }
    function shareAAR(id) { var logs = JSON.parse(localStorage.getItem('urbexLogs') || "[]"); var log = logs.find(function(l, index) { return (l.id || index) === id; }); if(log) { var shareText = "URBEX TOUR REPORT\nDatum: " + log.date + "\nDetails: " + log.text; if (navigator.share) { navigator.share({ title: 'Urbex Tour Log', text: shareText }).catch(function(err){}); } else { navigator.clipboard.writeText(shareText); alert("Text kopiert!"); } } }

    // --- TASKS ---
    function addTask() { var text = document.getElementById('taskText').value; var date = document.getElementById('taskDate').value; var prio = document.getElementById('taskPrio').value; if(text.trim() === "") return; var tasks = JSON.parse(localStorage.getItem('urbexTasks') || "[]"); tasks.push({ id: Date.now(), text: text, date: date || "Ohne Frist", prio: prio, status: "rot" }); localStorage.setItem('urbexTasks', JSON.stringify(tasks)); document.getElementById('taskText').value = ""; document.getElementById('taskDate').value = ""; loadTasks(); }
    function loadTasks() { 
        var tasks = JSON.parse(localStorage.getItem('urbexTasks') || "[]"); 
        var html = ""; 
        for(var i = 0; i < tasks.length; i++) { 
            var t = tasks[i]; 
            var sRot = t.status === 'rot' ? 'selected' : '';
            var sGelb = t.status === 'gelb' ? 'selected' : '';
            var sGrun = t.status === 'grun' ? 'selected' : '';
            var sBlau = t.status === 'blau' ? 'selected' : '';
            
            html += "<div class='task-card status-" + t.status + "'><strong>" + t.text + "</strong><span class='task-meta'>Frist: " + t.date + " | Prio: " + t.prio + "</span><select onchange='updateTaskStatus(" + t.id + ", this.value)'><option value='rot' " + sRot + ">🔴 Offen (To-Do)</option><option value='gelb' " + sGelb + ">🟡 In Bearbeitung</option><option value='grun' " + sGrun + ">🟢 Erledigt</option><option value='blau' " + sBlau + ">🔵 Zur Kenntnisnahme</option></select><div style='margin-top:8px;'><button class='btn-sm-cal' onclick=\"addToCalendar('" + t.text + "', '" + t.date + "')\">📅 KALENDER</button><button class='btn-sm-del' onclick='deleteTask(" + t.id + ")'>🗑️</button></div></div>"; 
        } 
        if(tasks.length === 0) html = "<p style='color:#888; font-size:12px;'>Keine offenen Notizen.</p>"; 
        document.getElementById('taskListContainer').innerHTML = html; 
    }
    
    function updateTaskStatus(id, newStatus) { var tasks = JSON.parse(localStorage.getItem('urbexTasks') || "[]"); for(var i = 0; i < tasks.length; i++) { if(tasks[i].id === id) tasks[i].status = newStatus; } localStorage.setItem('urbexTasks', JSON.stringify(tasks)); loadTasks(); }
    function deleteTask(id) { if(!confirm("Löschen?")) return; var tasks = JSON.parse(localStorage.getItem('urbexTasks') || "[]"); tasks = tasks.filter(t => t.id !== id); localStorage.setItem('urbexTasks', JSON.stringify(tasks)); loadTasks(); }
    function addToCalendar(title, dateStr) { if(dateStr === "Ohne Frist" || !dateStr) return alert("Gültiges Datum erforderlich!"); var dateParts = dateStr.split('-'); if(dateParts.length !== 3) return; var dtStart = dateParts[0] + dateParts[1] + dateParts[2] + "T090000Z"; var dtEnd = dateParts[0] + dateParts[1] + dateParts[2] + "T100000Z"; var icsMSG = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Urbex Companion App//DE\nBEGIN:VEVENT\nDTSTART:" + dtStart + "\nDTEND:" + dtEnd + "\nSUMMARY:[To-Do] " + title + "\nEND:VEVENT\nEND:VCALENDAR"; var blob = new Blob([icsMSG], { type: 'text/calendar;charset=utf-8' }); var link = document.createElement('a'); link.href = window.URL.createObjectURL(blob); link.setAttribute('download', 'GB_Massnahme.ics'); document.body.appendChild(link); link.click(); document.body.removeChild(link); }

    // --- STROBE & MATH LOCK LOGIC ---
    var strobeActive = false; 
    var strobeInterval;
    var expectedMathAnswer = 0;

    function handleStrobeClick(e) {
        if (!strobeActive) return; // Fail-safe
        
        if (strobeLockActive) {
            // Wenn der User in das Mathe-UI klickt, ignoriere den Klick (sonst triggert es neu)
            if (e.target.closest('#strobeMathUI')) return;
            
            // Zeige die Mathe-Aufgabe
            document.getElementById('strobeMathUI').style.display = 'block';
            let n1 = Math.floor(Math.random() * 20) + 1;
            let n2 = Math.floor(Math.random() * 20) + 1;
            expectedMathAnswer = n1 + n2;
            document.getElementById('strobeMathQuestion').innerText = n1 + " + " + n2 + " = ?";
            document.getElementById('strobeMathAnswer').value = "";
            document.getElementById('strobeMathAnswer').style.borderColor = "#c0392b"; // Reset color
            
        } else {
            // Normales Beenden
            clearInterval(strobeInterval); 
            document.getElementById('strobeScreen').style.display = "none"; 
            strobeActive = false; 
        }
    }

    function checkStrobeMath(e) {
        e.stopPropagation(); // Verhindert, dass das Klicken des Buttons den Background-Klick auslöst
        let ans = parseInt(document.getElementById('strobeMathAnswer').value);
        if(ans === expectedMathAnswer) {
            // Richtig! Strobe aus.
            clearInterval(strobeInterval); 
            document.getElementById('strobeScreen').style.display = "none"; 
            document.getElementById('strobeMathUI').style.display = 'none';
            strobeActive = false;
        } else {
            // Falsch! Vibriere und lass sie weiter leiden.
            document.getElementById('strobeMathAnswer').style.borderColor = "#e74c3c";
            document.getElementById('strobeMathAnswer').value = "";
            if("vibrate" in navigator) navigator.vibrate(200);
        }
    }

    function toggleStrobe() { 
        var strobe = document.getElementById('strobeScreen'); 
        if (!strobeActive) { 
            strobe.style.display = "block"; 
            strobeActive = true; 
            document.getElementById('strobeMathUI').style.display = 'none'; // Verstecke Mathe UI beim Start
            strobeInterval = setInterval(function() { 
                strobe.style.background = (strobe.style.background === "black") ? "white" : "black"; 
            }, 80); 
        } else { 
            // Falls sie über den Umweg "Toggle" versuchen auszuschalten, behandle es wie einen normalen Klick
            handleStrobeClick({target: strobe});
        } 
    }

    // --- GEFÄHRDUNGSBEURTEILUNG ---
    function checkGoNoGo() {
        var monat = document.getElementById('monat').value; var wetter = document.getElementById('wetter').value; var hasInfo = document.getElementById('hasInfo').value; var stollenTyp = document.getElementById('stollenTyp').value; var tiergefahr = document.getElementById('tiergefahr').value; var licht = document.getElementById('licht').value; var totmann = document.getElementById('totmann').value; var maske = document.getElementById('maske').value; var gaswarner = document.getElementById('gaswarner').value; var selbstretter = document.getElementById('selbstretter').value; var ifak = document.getElementById('ifak').value; 
        var akku = document.getElementById('akku').value;

        var box = document.getElementById("ergebnisBox"); box.style.display = "block"; var fehler = []; var warnungen = []; var buyLinks = "";

        if (monat === 'winter' && stollenTyp !== 'urban') fehler.push("ARTENSCHUTZ: Winterruhe beachten.");
        if (totmann === 'nein') fehler.push("TOTMANN: Kontaktperson fehlt.");
        
        if (wetter === 'ja') {
            fehler.push("WETTER: Starkregen! Gefahr unter Tage.");
        }
        
        if (akku === 'nein') {
            fehler.push("AKKU: Kritisch! 1/3-Regel für den Weg nicht erfüllt.");
        }
        
        if (ifak === 'nein') { fehler.push("IFAK: Erste Hilfe Set / Tourniquet fehlt!"); buyLinks += "<button class='btn btn-buy' onclick='alert(\"Link zum IFAK\")'>🛒 IFAK ansehen</button> "; }
        if (licht === 'nein') { fehler.push("LICHT: Keine Redundanz."); buyLinks += "<button class='btn btn-buy' onclick='alert(\"Link zum Backup-Licht\")'>🛒 Backup-Licht ansehen</button> "; }
        
        if (gaswarner === 'nein') { 
            fehler.push("GASGEFAHR: Multigas zwingend! (Verrottung/Zersetzung erzeugt unsichtbare Gase)."); 
            buyLinks += "<button class='btn btn-buy' onclick='alert(\"Link zum Gaswarner\")'>🛒 Gaswarner ansehen</button> "; 
        }
        
        if ((hasInfo === 'nein' || stollenTyp === 'nazi' || tiergefahr === 'ja') && maske === 'nein') { fehler.push("ATEMSCHUTZ: FFP3 Maske fehlt."); buyLinks += "<button class='btn btn-buy' onclick='alert(\"Link zur Maske\")'>🛒 Maske ansehen</button> "; }
        if ((stollenTyp === 'urban' || stollenTyp === 'agrar') && selbstretter === 'nein') warnungen.push("SELBSTRETTER: Empfohlen für diese Anlage.");
        if (stollenTyp === 'bergbau_alt') warnungen.push("STATIK: Vorsicht bei morschen Ausbauten.");
        
        var outHTML = "";
        if (fehler.length > 0) {
            box.style.backgroundColor = "#c0392b"; box.style.color = "white"; box.style.borderLeftColor = "#900"; outHTML = "🛑 PLANUNG UNVOLLSTÄNDIG!<ul><li>" + fehler.join("</li><li>") + "</li></ul>";
            if(buyLinks !== "") outHTML += "<div style='margin-top:10px; border-top:1px solid rgba(255,255,255,0.2); padding-top:10px;'>" + buyLinks + "</div>"; box.innerHTML = outHTML;
        } else if (warnungen.length > 0) {
            box.style.backgroundColor = "#f1c40f"; box.style.color = "black"; box.style.borderLeftColor = "#d4ac0d"; box.innerHTML = "⚠️ WARNUNG: RISIKO!<ul><li>" + warnungen.join("</li><li>") + "</li></ul>";
        } else {
            box.style.backgroundColor = "#27ae60"; 
            box.style.color = "white"; 
            box.style.borderLeftColor = "#1e8449"; 
            box.innerHTML = "Du bist vorbereitet. Denk an die Eigensicherung!<br><span style='font-size:11px;'>Glück auf!</span>";
        }
    }

    // --- BREATHING ---
    var isRunning = false; var phaseInterval; var phase = 0;
    function toggleBreathing() { var circle = document.getElementById('circle'); var instr = document.getElementById('instr'); var btn = document.getElementById('btn-breath'); if (isRunning) { clearInterval(phaseInterval); isRunning = false; btn.innerText = "START"; btn.style.backgroundColor = "#2980b9"; instr.innerText = "BEREIT"; circle.className = "breathing-circle"; phase = 0; } else { isRunning = true; btn.innerText = "STOPP"; btn.style.backgroundColor = "#c0392b"; runPhase(); phaseInterval = setInterval(runPhase, 4000); } }
    function runPhase() { var circle = document.getElementById('circle'); var instr = document.getElementById('instr'); if (phase === 0) { instr.innerText = "EINATMEN"; instr.style.color = "#27ae60"; circle.className = "breathing-circle phase-in"; } else if (phase === 1) { instr.innerText = "HALTEN"; instr.style.color = "#f1c40f"; } else if (phase === 2) { instr.innerText = "AUSATMEN"; instr.style.color = "#2980b9"; circle.className = "breathing-circle phase-out"; } else if (phase === 3) { instr.innerText = "HALTEN"; instr.style.color = "#f1c40f"; } phase = (phase + 1) % 4; }

    // --- ROTLICHT MODUS LOGIK ---
    let isRed = false;
    function toggleRedMode() {
        document.body.classList.toggle('red-mode');
        isRed = !isRed;
        document.querySelector('.red-toggle').innerText = isRed ? "⚪ NORMAL MODE" : "🔴 RED MODE";
    }

    // --- BEACON LOGIK (Akustisch 3000Hz) ---
    let beaconInt;
    function toggleBeacon() {
        if(beaconInt) { 
            clearInterval(beaconInt); beaconInt = null; 
            alert("Ton-Signal Deaktiviert");
        } else {
            alert("Ton-Signal Aktiviert - Handy erzeugt SOS-Intervall!");
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            beaconInt = setInterval(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'square'; osc.frequency.value = 3000;
                gain.gain.setValueAtTime(1.0, ctx.currentTime);
                osc.start(); osc.stop(ctx.currentTime + 0.2);
            }, 1000);
        }
    }

    // --- DATENSICHERUNG (IMPORT / EXPORT) ---
    function exportData() {
        var data = {
            logs: JSON.parse(localStorage.getItem('urbexLogs') || "[]"),
            tasks: JSON.parse(localStorage.getItem('urbexTasks') || "[]")
        };
        var dataStr = JSON.stringify(data);
        var blob = new Blob([dataStr], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "Urbex_Tour_Backup_" + new Date().toISOString().slice(0,10) + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData(event) {
        var file = event.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (data.logs) {
                    try {
                        localStorage.setItem('urbexLogs', JSON.stringify(data.logs));
                    } catch(err) {
                        alert("❌ Speicherfehler beim Importieren des Logbuchs!");
                    }
                }
                if (data.tasks) {
                    try {
                        localStorage.setItem('urbexTasks', JSON.stringify(data.tasks));
                    } catch(err) {
                        alert("❌ Speicherfehler beim Importieren der Aufgaben!");
                    }
                }
                alert("✅ Backup erfolgreich geladen!\nLogbuch und Notizen wurden wiederhergestellt.");
                loadAAR();
                loadTasks();
            } catch(err) {
                alert("❌ Fehler beim Import!\nDie Datei ist ungültig oder beschädigt.");
            }
        };
        reader.readAsText(file);
        event.target.value = ""; 
    }
