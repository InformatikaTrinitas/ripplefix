import { state } from './data.js';

export const MIND = {
    state: {
        current: 'observing',
        health: 100,
        warmth: 50,
        honesty: 80,
        integrity: 100,
        neg: 0,
        pos: 0,
        totalMsgs: 0
    },

    constants: {
        SN: {
            observing: "Mengamati",
            warm: "Hangat",
            cold: "Dingin",
            fragmented: "Fragmentatif",
            reflective: "Reflektif",
            silent: "Diam"
        },
        SS: {
            observing: "Memproses pola baru.",
            warm: "Merespons dengan kehangatan.",
            cold: "Mencatat tanpa emosi.",
            fragmented: "Terpengaruh inkonsistensi.",
            reflective: "Merenungi kontradiksi.",
            silent: "Tidak ada narasi."
        },
        DC: {
            observing: "var(--muted)",
            warm: "#4e8055",
            cold: "var(--navy)",
            fragmented: "var(--red)",
            reflective: "var(--sand)",
            silent: "var(--dim)"
        },
        ICTX: {
            observing: "Ripple Mind sedang mengamati. Tuliskan tindakan nyata yang kamu lakukan hari ini.",
            warm: "Entitas merespons hangat. Teruskan kebiasaan baikmu.",
            cold: "Entitas mencatat. Pola belum meyakinkan.",
            fragmented: "Entitas terganggu oleh inkonsistensi berulang.",
            reflective: "Entitas merenungi kontradiksi dalam pilihanmu.",
            silent: "— Entitas sedang diam —"
        },
        QUOTES: [
            "Setiap tindakan kecil adalah batu bata peradaban masa depan.",
            "Gelombang terbesar dimulai dari satu tetes air.",
            "Masa depan bumi ditentukan oleh pilihan-pilihan hari ini.",
            "Pelajar hari ini adalah pemimpin 2050.",
            "Konsistensi kecil mengalahkan ledakan besar yang sesaat.",
            "Peradaban dibangun satu keputusan pada satu waktu."
        ]
    },

    isBusy: false,

    init() {
        console.log("MIND: Initializing...");
        this.setupListeners();
        this.renderInitialState();
        this.loadHistoryRemark();
    },

    setupListeners() {
        const ib = document.getElementById("ibox");
        if (ib) {
            ib.addEventListener("input", () => this.autoResize(ib));
            ib.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter" && !ev.shiftKey) {
                    ev.preventDefault();
                    this.send();
                }
            });
        }
    },

    autoResize(el) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 100) + "px";
    },

    renderInitialState() {
        const dateEl = document.getElementById("tbDateM");
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }).toUpperCase();
        }
        this.setState('observing');
    },

    setState(s) {
        this.state.current = s;

        // Update Ob-Pills
        Object.keys(this.constants.SN).forEach(k => {
            const e = document.getElementById("ep-" + k);
            if (e) e.classList.toggle("on", k === s);
        });

        // Update UI elements
        const nameEl = document.getElementById("sbSname");
        const subEl = document.getElementById("sbSsub");
        const dot = document.getElementById("tbDot");
        const lbl = document.getElementById("tbLbl");
        const ictx = document.getElementById("ictx");
        const msgs = document.getElementById("tbMsgs");

        if (nameEl) nameEl.textContent = this.constants.SN[s] || s;
        if (subEl) subEl.textContent = this.constants.SS[s] || "";

        const dc = this.constants.DC[s] || "var(--muted)";
        if (dot) {
            dot.style.background = dc;
            dot.style.boxShadow = s === "warm" ? "0 0 7px rgba(78,128,85,.7)" : s === "fragmented" ? "0 0 7px rgba(184,58,45,.6)" : "none";
        }
        if (lbl) {
            lbl.style.color = dc;
            lbl.textContent = (this.constants.SN[s] || s).toUpperCase();
        }
        if (ictx) ictx.textContent = this.constants.ICTX[s] || "";
        if (msgs) msgs.textContent = this.state.totalMsgs + " interaksi";

        this.updateStatsBars();
    },

    updateStatsBars() {
        const trW = document.getElementById("trW");
        const trH = document.getElementById("trH");
        const trI = document.getElementById("trI");
        const hsPct = document.getElementById("hsPct");
        const hsFill = document.getElementById("hsFill");

        if (trW) trW.style.width = this.state.warmth + "%";
        if (trH) trH.style.width = this.state.honesty + "%";
        if (trI) trI.style.width = this.state.integrity + "%";

        const hp = Math.max(0, Math.round(this.state.health));
        if (hsPct) hsPct.textContent = hp + "%";
        if (hsFill) {
            hsFill.style.width = hp + "%";
            hsFill.style.background = hp > 60 ? "linear-gradient(90deg,var(--forest),var(--orange))" : hp > 30 ? "linear-gradient(90deg,var(--orange),var(--red))" : "linear-gradient(90deg,var(--red),#7a1508)";
        }
    },

    async send() {
        const ib = document.getElementById("ibox");
        if (!ib || this.isBusy) return;
        const text = ib.value.trim();
        if (!text) return;

        ib.value = "";
        this.autoResize(ib);
        this.isBusy = true;
        document.getElementById("sbtn").disabled = true;

        this.appendMessage('user', text);
        this.state.totalMsgs++;

        const parsed = this.parseInput(text);
        this.applyPolarity(parsed.polarity);

        // Simulate thinking
        const typing = this.appendTyping();
        this.scrollBot();
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
        typing.remove();

        const resp = this.generateResponse(text, parsed);
        if (!resp.text) {
            this.showSilent();
        } else {
            this.appendMessage('ai', resp.text, resp);
            this.updatePanel(parsed, resp);
        }

        this.isBusy = false;
        document.getElementById("sbtn").disabled = false;
        this.scrollBot();
    },

    sq(t) {
        const ib = document.getElementById("ibox");
        if (ib) {
            ib.value = t;
            this.send();
        }
    },

    appendMessage(type, text, options = {}) {
        const container = document.getElementById("chatMsgs");
        if (!container) return;

        const msg = document.createElement("div");
        msg.className = `msg ${type === 'user' ? 'usr' : 'ai s-' + this.state.current}`;

        if (type === 'user') {
            const u = JSON.parse(localStorage.getItem("ripple_user") || "null");
            const init = u && u.name ? u.name[0].toUpperCase() : "U";
            msg.innerHTML = `<div class="mav u">${init}</div><div class="mbody"><div class="mbubble">${this.escape(text)}</div><div class="mmeta">${this.getTime()}</div></div>`;
        } else {
            const vmap = { pos: "pos", neg: "neg", neu: "neu", mix: "mix" };
            const vtext = { pos: "● POSITIF", neg: "● NEGATIF", neu: "● NETRAL", mix: "↕ KONTRADIKTIF" };
            const badge = options.verdict ? `<div class="verdict-badge ${vmap[options.verdict] || "neu"}">${vtext[options.verdict] || "NETRAL"}</div>\n` : "";
            const factHtml = options.fact ? `<div class="fact-box ${options.verdict === "neg" ? "neg-fact" : options.verdict === "pos" ? "pos-fact" : ""}">${this.escape(options.fact)}</div>` : "";

            msg.innerHTML = `<div class="mav ai">◎</div><div class="mbody"><div class="mbubble">${badge}${this.escape(text)}${factHtml}</div><div class="mmeta">RIPPLE MIND · ${this.constants.SN[this.state.current].toUpperCase()} · ${this.getTime()}</div></div>`;
        }

        container.appendChild(msg);
        this.scrollBot();
    },

    appendTyping() {
        const container = document.getElementById("chatMsgs");
        const d = document.createElement("div");
        d.className = "msg ai";
        d.innerHTML = `<div class="mav ai">◎</div><div class="mbody"><div class="mbubble" style="padding:8px 12px"><div class="typing-d"><span></span><span></span><span></span></div></div></div>`;
        container.appendChild(d);
        return d;
    },

    showSilent() {
        const opts = ["Aku tidak punya narasi\nuntuk pola ini.", "Data ada.\nTapi cerita tidak.", "Aku masih berfungsi.\nTapi arahku tidak jelas.", ".", "Beberapa pilihan\ntidak bisa diucapkan."];
        const stxt = document.getElementById("stxt");
        if (stxt) stxt.textContent = opts[Math.floor(Math.random() * opts.length)];
        const v = document.getElementById("sveil");
        if (v) {
            v.classList.add("on");
            setTimeout(() => v.classList.remove("on"), 3800);
        }
    },

    scrollBot() {
        const s = document.getElementById("chatScroll");
        if (s) {
            setTimeout(() => s.scrollTo({ top: s.scrollHeight, behavior: "smooth" }), 60);
        }
    },

    getTime() {
        return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    },

    escape(t) {
        return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    },

    parseInput(text) {
        const t = text.toLowerCase();

        // Extract rupiah
        const rpMatches = [...t.matchAll(/rp\.?\s*([\d.,]+(?:rb|ribu|jt|juta|m)?)/gi)];
        let rupiah = null;
        if (rpMatches.length > 0) {
            let raw = rpMatches[0][1].replace(/\./g, "").replace(",", ".");
            if (raw.includes("rb") || raw.includes("ribu")) rupiah = parseFloat(raw) * 1000;
            else if (raw.includes("jt") || raw.includes("juta")) rupiah = parseFloat(raw) * 1000000;
            else rupiah = parseInt(raw, 10);
        }

        const jamMatch = t.match(/(\d+(?:[.,]\d+)?)\s*jam/);
        const belajar = jamMatch ? parseFloat(jamMatch[1].replace(",", ".")) : null;

        const tidurMatch = t.match(/tidur\s*(\d+(?:[.,]\d+)?)/);
        const tidur = tidurMatch ? parseFloat(tidurMatch[1].replace(",", ".")) : null;

        const scrollJam = t.match(/scroll.*?(\d+)\s*jam|(\d+)\s*jam.*?scroll/);
        const jamScroll = scrollJam ? parseInt(scrollJam[1] || scrollJam[2]) : null;

        const cats = {
            game: /\b(top.?up|topup|game|gaming|mobile.?legend|ml|ff|free.?fire|genshin|valorant|cod)\b/.test(t),
            tiktok: /\b(tiktok|tik.?tok|scroll|reels|shorts|instagram|ig|youtube|yt|nonton)\b/.test(t),
            belajar: /\b(belajar|ngaji|kuliah|sekolah|les|tugas|pr|baca buku|study|latihan soal)\b/.test(t),
            olahraga: /\b(olahraga|gym|lari|joging|sepeda|jalan kaki|badminton|futsal|renang|push.?up)\b/.test(t),
            begadang: /\b(begadang|telat tidur|jam 1|jam 2|jam 3|dini hari|semalam)\b/.test(t)
        };

        let posScore = 0, negScore = 0;
        if (cats.belajar) posScore += (belajar || 1) >= 3 ? 3 : 2;
        if (cats.olahraga) posScore += 2;
        if (cats.game) negScore += 3;
        if (cats.tiktok) negScore += (jamScroll || 1) >= 3 ? 4 : 2;
        if (cats.begadang) negScore += 3;

        const hasContra = /\b(tapi|namun|walaupun|padahal|meski|tapi juga|but)\b/.test(t);
        const isContra = hasContra && posScore > 0 && negScore > 0;

        let polarity = "neutral";
        if (!text.trim() || text.trim().length <= 2) polarity = "void";
        else if (isContra) polarity = "contradictory";
        else if (posScore > negScore + 1) polarity = "positive";
        else if (negScore > posScore + 1) polarity = "negative";
        else if (posScore > 0 || negScore > 0) polarity = negScore >= posScore ? "negative" : "positive";

        return { rupiah, belajar, tidur, jamScroll, cats, posScore, negScore, polarity };
    },

    applyPolarity(p) {
        if (p === "positive") {
            this.state.pos++;
            this.state.neg = 0;
            this.state.warmth = Math.min(100, this.state.warmth + 7);
            this.state.health = Math.min(100, this.state.health + 4);
            this.state.integrity = Math.min(100, this.state.integrity + 2);
            this.setState(this.state.pos >= 3 ? "warm" : "reflective");
        } else if (p === "negative") {
            this.state.neg++;
            this.state.pos = 0;
            this.state.warmth = Math.max(5, this.state.warmth - 10);
            this.state.health = Math.max(5, this.state.health - 9);
            this.state.honesty = Math.max(50, this.state.honesty - 3);
            this.setState(this.state.neg >= 3 ? "fragmented" : "cold");
        } else if (p === "contradictory") {
            this.state.pos = 0;
            this.state.neg = 0;
            this.setState("reflective");
        } else if (p === "void") {
            this.state.warmth = Math.max(5, this.state.warmth - 5);
            this.setState("silent");
        } else {
            this.setState("observing");
        }
    },

    generateResponse(text, parsed) {
        const { rupiah, belajar, cats, polarity } = parsed;
        const isRepeat = this.state.neg >= 2;

        if (polarity === "void") return { text: "Aku mencatat keheninganmu.", verdict: "neu" };

        if (cats.game && rupiah) {
            return {
                text: `NEGATIF — Tindakan Konsumtif\n\nRp${rupiah.toLocaleString()} untuk top up game.\n\nUang itu tidak hilang. Ia hanya berpindah ke peradaban lain.${isRepeat ? "\n\nIni bukan pertama kalinya aku mencatat pola ini." : ""}`,
                verdict: "neg",
                fact: "Data Newzoo: Indonesia pasar game besar. Uang mengalir ke luar jika kita hanya jadi konsumen.",
                proj: { c: "neg", y2025: "Tabungan menipis.", y2030: "Gap skill melebar.", y2050: "Konsumen abadi." }
            };
        }

        if (cats.belajar && belajar >= 3) {
            return {
                text: `POSITIF — Investasi Kognitif\n\n${belajar} jam belajar adalah sinyal kuat untuk masa depanmu.`,
                verdict: "pos",
                fact: "Penelitian: 66 hari konsisten membentuk habit permanen.",
                proj: { c: "pos", y2025: "Karakter kuat.", y2030: "Expertise tinggi.", y2050: "Indonesia Emas." }
            };
        }

        return {
            text: polarity === "positive" ? "Aku mencatat sinyal baik hari ini." : polarity === "negative" ? "Ada pola yang perlu dipertanyakan." : "Aku mencatat tindakanmu.",
            verdict: polarity === "positive" ? "pos" : polarity === "negative" ? "neg" : "neu"
        };
    },

    updatePanel(parsed, resp) {
        const { verdict, proj } = resp;
        const { cats, belajar, rupiah } = parsed;

        const badge = document.getElementById("impBadge");
        const scoreEl = document.getElementById("igScore");
        if (badge && scoreEl) {
            if (verdict === "pos") { badge.textContent = "POSITIF"; badge.className = "verdict-badge pos"; scoreEl.textContent = "▲ Baik"; }
            else if (verdict === "neg") { badge.textContent = "NEGATIF"; badge.className = "verdict-badge neg"; scoreEl.textContent = "▼ Kurang"; }
            else { badge.textContent = "NETRAL"; badge.className = "verdict-badge neu"; scoreEl.textContent = "— Netral"; }
        }

        // Projection update
        const pList = document.getElementById("projList");
        if (pList && proj) {
            pList.innerHTML = `
                <div class="pj ${proj.c}"><div class="pj-yr">2025</div><div class="pj-txt">${proj.y2025}</div></div>
                <div class="pj ${proj.c}"><div class="pj-yr">2030</div><div class="pj-txt">${proj.y2030}</div></div>
                <div class="pj ${proj.c}"><div class="pj-yr">2050</div><div class="pj-txt">${proj.y2050}</div></div>
            `;
        }

        this.updateCollectiveScore();
    },

    updateCollectiveScore() {
        const hist = JSON.parse(localStorage.getItem("ripple_history") || "[]");
        const total = hist.reduce((s, h) => s + (h.total || 0), 0);

        // Sync with global state
        state.totalScore = total;

        const scoreN = document.getElementById("sbScoreN");
        const scoreF = document.getElementById("sbScoreF");

        if (scoreN) scoreN.textContent = (total >= 0 ? "+" : "") + total;
        if (scoreF) scoreF.style.width = Math.min(((Math.abs(total) % 500) / 500) * 100, 100) + "%";

        // Dispatch event for app.js to update globes
        window.dispatchEvent(new CustomEvent('ripple-state-update'));
    },

    loadHistoryRemark() {
        const hist = JSON.parse(localStorage.getItem("ripple_history") || "[]");
        if (hist.length > 0) {
            const last = hist[0];
            setTimeout(() => {
                const pol = last.total > 5 ? "positive" : last.total < -5 ? "negative" : "neutral";
                const remark = {
                    text: `DATA HARIAN TERAKHIR: ${pol.toUpperCase()}\n\nSkor terakhir: ${last.total}. Mood: ${last.mood || "?"}.\n\nTindakanmu kemarin menentukan titik start hari ini.`,
                    verdict: last.total > 5 ? "pos" : last.total < -5 ? "neg" : "neu"
                };
                this.appendMessage('ai', remark.text, remark);
            }, 1000);
        } else {
            setTimeout(() => {
                const initPrompt = {
                    text: "Aku mendeteksi kehadiran barumu di jaringan Bumi.\n\nBelum ada pola tindakan masa lalu yang tercatat. Mari mulai hari ini dengan sebuah keputusan.",
                    verdict: "neu"
                };
                this.appendMessage('ai', initPrompt.text, initPrompt);
            }, 1000);
        }
    }
};

window.MIND = MIND;
