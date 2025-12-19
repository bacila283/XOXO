document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    // Элементы DOM
    const gameBoard = document.getElementById('gameBoard');
    const playerTurn = document.getElementById('playerTurn');
    const statusMessage = document.getElementById('statusMessage');
    const restartBtn = document.getElementById('restartBtn');
    const changeThemeBtn = document.getElementById('changeTheme');
    const themeName = document.getElementById('themeName');
    
    // Новые элементы для кода победы
    const winCodeContainer = document.getElementById('winCodeContainer');
    const winCode = document.getElementById('winCode');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const copyMessage = document.getElementById('copyMessage');

    // Темы
    const themes = [
        {
            name: 'Фиолетовая',
            class: '',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        {
            name: 'Персиковая',
            class: 'theme-peach',
            gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFDAB9 100%)'
        },
        {
            name: 'Нежно-розовая',
            class: 'theme-soft-pink',
            gradient: 'linear-gradient(135deg, #FFC8DD 0%, #FFAFCC 100%)'
        }
    ];

    // Состояние игры
    let currentPlayer = 'X';
    let gameBoardState = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let currentTheme = 0;
    let victoryCode = '';

    // Комбинации для победы
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Горизонтальные
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Вертикальные
        [0, 4, 8], [2, 4, 6]             // Диагональные
    ];

    // Инициализация игры
    function initGame() {
        // Устанавливаем случайную тему при загрузке
        currentTheme = Math.floor(Math.random() * themes.length);
        applyTheme();
        
        // Скрываем блок с кодом победы
        winCodeContainer.style.display = 'none';
        copyMessage.textContent = '';
        
        // Создаем игровое поле
        createBoard();
        updatePlayerTurn();
        statusMessage.textContent = '';
        
        // Настройка Telegram
        tg.setHeaderColor(getComputedStyle(document.body).getPropertyValue('--primary-light'));
        tg.setBackgroundColor(getComputedStyle(document.body).getPropertyValue('--primary-light'));
    }

    // Генерация 5-значного кода
    function generateVictoryCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Исключаем похожие символы
        let code = '';
        
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return code;
    }

    // Показать код победы
    function showVictoryCode() {
        victoryCode = generateVictoryCode();
        winCode.textContent = victoryCode;
        winCodeContainer.style.display = 'block';
        
        // Анимация появления
        setTimeout(() => {
            winCodeContainer.style.opacity = '0';
            winCodeContainer.style.transform = 'translateY(10px)';
            winCodeContainer.style.display = 'block';
            
            setTimeout(() => {
                winCodeContainer.style.transition = 'all 0.5s ease';
                winCodeContainer.style.opacity = '1';
                winCodeContainer.style.transform = 'translateY(0)';
                
                setTimeout(() => {
                    winCodeContainer.style.transition = '';
                }, 500);
            }, 10);
        }, 10);
    }

    // Копирование кода в буфер обмена
    function copyCodeToClipboard() {
        navigator.clipboard.writeText(victoryCode)
            .then(() => {
                // Показать сообщение об успехе
                copyMessage.textContent = '✅ Код скопирован в буфер обмена!';
                copyMessage.className = 'win-code-message success';
                
                // Визуальная обратная связь на кнопке
                copyCodeBtn.classList.add('copied');
                copyCodeBtn.innerHTML = '<span class="copy-icon">✅</span><span class="copy-text">Скопировано!</span>';
                
                // Возвращаем исходное состояние через 3 секунды
                setTimeout(() => {
                    copyCodeBtn.classList.remove('copied');
                    copyCodeBtn.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">Копировать</span>';
                    copyMessage.textContent = '';
                }, 3000);
            })
            .catch(err => {
                console.error('Ошибка при копировании: ', err);
                copyMessage.textContent = '❌ Ошибка при копировании';
                copyMessage.className = 'win-code-message error';
                
                setTimeout(() => {
                    copyMessage.textContent = '';
                }, 3000);
            });
    }

    // Применение темы
    function applyTheme() {
        const theme = themes[currentTheme];
        document.body.className = theme.class;
        document.body.style.background = theme.gradient;
        themeName.textContent = theme.name;
        tg.setHeaderColor(theme.gradient.includes('667eea') ? '#667eea' : 
                         theme.gradient.includes('FFB6C1') ? '#FFB6C1' : '#FFC8DD');
    }

    // Смена темы
    function changeTheme() {
        currentTheme = (currentTheme + 1) % themes.length;
        applyTheme();
        
        // Добавляем анимацию смены темы
        document.body.style.transition = 'background 0.5s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 500);
    }

    // Создание игрового поля
    function createBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', () => handleCellClick(i));
            gameBoard.appendChild(cell);
        }
    }

    // Обработка клика по ячейке
    function handleCellClick(index) {
        if (!gameActive || gameBoardState[index] !== '' || currentPlayer === 'O') return;

        makeMove(index);

        if (gameActive && currentPlayer === 'O') {
            setTimeout(makeBotMove, 600); // Задержка для лучшего UX
        }
    }

    // Сделать ход
    function makeMove(index) {
        gameBoardState[index] = currentPlayer;
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.textContent = currentPlayer === 'X' ? '❌' : '⭕';
        cell.classList.add(currentPlayer.toLowerCase());
        
        // Анимация появления символа
        cell.style.opacity = '0';
        cell.style.transform = 'scale(0.5)';
        setTimeout(() => {
            cell.style.transition = 'all 0.3s ease';
            cell.style.opacity = '1';
            cell.style.transform = 'scale(1)';
        }, 10);

        if (checkWin()) {
            handleWin();
        } else if (checkDraw()) {
            handleDraw();
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updatePlayerTurn();
        }
    }

    // Ход бота
    function makeBotMove() {
        if (!gameActive) return;

        let moveIndex = findBestMove();
        
        // Если нет хорошего хода, выбираем случайную свободную ячейку
        if (moveIndex === -1) {
            const emptyCells = gameBoardState
                .map((cell, index) => cell === '' ? index : null)
                .filter(index => index !== null);
            
            if (emptyCells.length > 0) {
                moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        }

        if (moveIndex !== -1) {
            makeMove(moveIndex);
        }
    }

    // Поиск лучшего хода для бота
    function findBestMove() {
        // 1. Попробовать выиграть
        for (let i = 0; i < gameBoardState.length; i++) {
            if (gameBoardState[i] === '') {
                gameBoardState[i] = 'O';
                if (checkWinForPlayer('O')) {
                    gameBoardState[i] = '';
                    return i;
                }
                gameBoardState[i] = '';
            }
        }

        // 2. Попробовать заблокировать игрока
        for (let i = 0; i < gameBoardState.length; i++) {
            if (gameBoardState[i] === '') {
                gameBoardState[i] = 'X';
                if (checkWinForPlayer('X')) {
                    gameBoardState[i] = '';
                    return i;
                }
                gameBoardState[i] = '';
            }
        }

        // 3. Занять центр если свободен
        if (gameBoardState[4] === '') return 4;

        // 4. Занять углы
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter(index => gameBoardState[index] === '');
        if (emptyCorners.length > 0) {
            return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        }

        // 5. Любую свободную ячейку
        return -1;
    }

    // Проверка победы для конкретного игрока
    function checkWinForPlayer(player) {
        return winningConditions.some(condition => {
            return condition.every(index => gameBoardState[index] === player);
        });
    }

    // Проверка победы
    function checkWin() {
        return winningConditions.some(condition => {
            const [a, b, c] = condition;
            return gameBoardState[a] !== '' && 
                   gameBoardState[a] === gameBoardState[b] && 
                   gameBoardState[a] === gameBoardState[c];
        });
    }

    // Проверка ничьей
    function checkDraw() {
        return gameBoardState.every(cell => cell !== '');
    }

    // Обработка победы
    function handleWin() {
        gameActive = false;
        
        // Находим выигрышную комбинацию
        let winCombo = [];
        winningConditions.forEach(condition => {
            const [a, b, c] = condition;
            if (gameBoardState[a] !== '' && 
                gameBoardState[a] === gameBoardState[b] && 
                gameBoardState[a] === gameBoardState[c]) {
                winCombo = condition;
            }
        });

        // Анимация победных ячеек
        winCombo.forEach((index, i) => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            cell.classList.add('winner');
            
            // Задержка для последовательной анимации
            setTimeout(() => {
                cell.classList.add('win-flash');
            }, i * 200);
        });

        // Показываем сообщение о победе
        let message = '';
        let emoji = '';
        
        if (currentPlayer === 'X') {
            message = '🎉 Вы победили!';
            emoji = '🥳';
            statusMessage.style.color = 'var(--x-color)';
            
            // Показываем код победы только если победил игрок
            setTimeout(() => {
                showVictoryCode();
            }, 1500);
        } else {
            message = '🤖 Бот победил!';
            emoji = '😅';
            statusMessage.style.color = 'var(--o-color)';
            
            // Скрываем блок с кодом если победил бот
            winCodeContainer.style.display = 'none';
        }
        
        statusMessage.innerHTML = `${emoji} ${message}`;
        statusMessage.classList.add('win-message');
    }

    // Обработка ничьей
    function handleDraw() {
        gameActive = false;
        statusMessage.innerHTML = '🤝 <strong>Ничья!</strong> Попробуйте еще раз!';
        statusMessage.style.color = '#666';
        
        // Скрываем блок с кодом при ничье
        winCodeContainer.style.display = 'none';
        
        // Анимация для ничьей
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    cell.style.transform = 'scale(1)';
                }, 200);
            }, index * 100);
        });
    }

    // Обновление отображения хода
    function updatePlayerTurn() {
        if (currentPlayer === 'O') {
            playerTurn.innerHTML = '🤖 <span class="o-turn">Ход бота...</span>';
        } else {
            playerTurn.innerHTML = 'Ход: <span class="x-turn">❌ Ваш ход</span>';
        }
    }

    // Новая игра
    function restartGame() {
        currentPlayer = 'X';
        gameBoardState = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        
        // Скрываем код победы
        winCodeContainer.style.display = 'none';
        copyMessage.textContent = '';
        
        // Анимация очистки поля
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.opacity = '0.5';
                cell.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    cell.textContent = '';
                    cell.className = 'cell';
                    cell.style.opacity = '1';
                    cell.style.transform = 'scale(1)';
                    cell.dataset.index = index;
                    cell.addEventListener('click', () => handleCellClick(index));
                }, 150);
            }, index * 50);
        });
        
        updatePlayerTurn();
        statusMessage.textContent = '';
        statusMessage.classList.remove('win-message');
        
        // Если игра только началась и это новая игра, бот не должен ходить первым
        if (gameBoardState.every(cell => cell === '') && Math.random() > 0.5) {
            // С шансом 50% бот ходит первым
            setTimeout(() => {
                currentPlayer = 'O';
                updatePlayerTurn();
                setTimeout(makeBotMove, 800);
            }, 1000);
        }
    }

    // Обработчики событий
    restartBtn.addEventListener('click', restartGame);
    changeThemeBtn.addEventListener('click', changeTheme);
    copyCodeBtn.addEventListener('click', copyCodeToClipboard);

    // Запуск игры
    initGame();

    // Обработчик для телеграм кнопки "Назад"
    tg.BackButton.onClick(() => {
        tg.close();
    });
});