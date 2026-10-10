const teamTable = document.getElementById("teamTable");
const addTeamButton = document.getElementById("addTeamButton");
const saveButton = document.getElementById("saveButton");
const statusText = document.getElementById("status");

const exportButton = document.getElementById("exportButton");
const importFile = document.getElementById("importFile");

const STORAGE_KEY = "lck_stove_league_teams";

const LANES = [
    "TOP",
    "JUNGLE",
    "MID",
    "ADC",
    "SUPPORT"
];

let teams = [];

// 저장된 데이터 불러오기
function loadTeams() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
            const parsedData = JSON.parse(savedData);

            if (!Array.isArray(parsedData)) {
                throw new Error("잘못된 데이터 형식");
            }

            teams = parsedData.map(team => ({
                name: String(team.name ?? ""),
                players: LANES.map((_, index) =>
                    String(team.players?.[index] ?? "")
                )
            }));

            renderTeams();
            statusText.textContent = "저장된 데이터를 불러왔습니다.";
            return;
        }
    } catch (error) {
        statusText.textContent =
            "저장된 데이터를 읽지 못했습니다. 백업 파일을 확인하세요.";
        teams = [];
        renderTeams();
        return;
    }

    // 처음 실행할 때 기본 팀 생성
    teams = [
        createTeam("T1"),
        createTeam("Gen.G"),
        createTeam("한화생명"),
        createTeam("DK"),
        createTeam("KT"),
        createTeam("DRX"),
        createTeam("농심"),
        createTeam("BNK")
    ];

    renderTeams();
}

// 새로운 팀 데이터 생성
function createTeam(name = "") {
    return {
        name: name,
        players: ["", "", "", "", ""]
    };
}

// 팀 목록 화면에 표시
function renderTeams() {
    teamTable.innerHTML = "";

    teams.forEach((team, teamIndex) => {
        const row = document.createElement("tr");

        // 팀 이름 입력 칸
        const teamCell = document.createElement("td");
        const teamInput = document.createElement("input");

        teamInput.type = "text";
        teamInput.className = "team-input";
        teamInput.placeholder = "팀 이름";
        teamInput.value = team.name;

        teamInput.addEventListener("input", event => {
            teams[teamIndex].name = event.target.value;
            markUnsaved();
        });

        teamCell.appendChild(teamInput);
        row.appendChild(teamCell);

        // TOP, JUNGLE, MID, ADC, SUPPORT 입력 칸
        LANES.forEach((lane, laneIndex) => {
            const cell = document.createElement("td");
            const playerInput = document.createElement("input");

            playerInput.type = "text";
            playerInput.className = "player-input";
            playerInput.placeholder = lane;
            playerInput.value = team.players[laneIndex];

            playerInput.addEventListener("input", event => {
                teams[teamIndex].players[laneIndex] =
                    event.target.value;

                markUnsaved();
            });

            cell.appendChild(playerInput);
            row.appendChild(cell);
        });

        // 팀 삭제 버튼
        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "삭제";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", () => {
            const teamName = teams[teamIndex].name || "이 팀";

            if (!confirm(`${teamName}을(를) 삭제할까요?`)) {
                return;
            }

            teams.splice(teamIndex, 1);
            renderTeams();
            markUnsaved();
        });

        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        teamTable.appendChild(row);
    });
}

// 저장되지 않은 변경사항 표시
function markUnsaved() {
    statusText.textContent = "변경사항이 있습니다. 저장하기를 눌러주세요.";
}

// 저장하기
function saveTeams() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));

        statusText.textContent =
            "저장 완료! 다음에 접속해도 데이터를 불러올 수 있습니다.";
    } catch (error) {
        statusText.textContent =
            "저장에 실패했습니다. 브라우저 저장 공간을 확인하세요.";
    }
}

// 팀 추가
addTeamButton.addEventListener("click", () => {
    teams.push(createTeam(""));
    renderTeams();
    markUnsaved();

    // 새 팀의 팀 이름 칸에 포커스
    const inputs = teamTable.querySelectorAll(".team-input");
    inputs[inputs.length - 1]?.focus();
});

// 저장 버튼
saveButton.addEventListener("click", saveTeams);

// 백업 파일로 내보내기
exportButton.addEventListener("click", () => {
    const data = JSON.stringify(teams, null, 2);

    const blob = new Blob(
        [data],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "lck-stove-league-backup.json";
    link.click();

    URL.revokeObjectURL(url);

    statusText.textContent = "백업 파일을 생성했습니다.";
});

// 백업 파일 불러오기
importFile.addEventListener("change", event => {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const importedData = JSON.parse(reader.result);

            if (!Array.isArray(importedData)) {
                throw new Error("잘못된 파일");
            }

            const validData = importedData.map(team => {
                if (
                    !team ||
                    typeof team !== "object" ||
                    !Array.isArray(team.players)
                ) {
                    throw new Error("잘못된 팀 데이터");
                }

                return {
                    name: String(team.name ?? ""),
                    players: LANES.map((_, index) =>
                        String(team.players[index] ?? "")
                    )
                };
            });

            if (!confirm("현재 표를 백업 파일의 내용으로 교체할까요?")) {
                return;
            }

            teams = validData;
            renderTeams();
            saveTeams();

        } catch (error) {
            alert("파일을 불러오지 못했습니다. 올바른 백업 파일인지 확인하세요.");
        }

        importFile.value = "";
    };

    reader.readAsText(file);
});

// 처음 실행
loadTeams();
