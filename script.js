const inputForm = document.getElementById('input-form');
const resultSection = document.getElementById('result-section');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const settingsButton = document.getElementById('settingsButton');
const backButton = document.getElementById('backButton');
const shareButton = document.getElementById('shareButton');
const salaryInteger = document.getElementById('salary-integer');
const salaryDecimal = document.getElementById('salary-decimal');
const timeWorked = document.getElementById('time-worked');
const remainingTime = document.getElementById('remaining-time');
const dailyIncome = document.getElementById('daily-income');
const perSecond = document.getElementById('per-second');
const dayProgressBar = document.getElementById('day-progress-bar');
const hourProgressBar = document.getElementById('hour-progress-bar');
const dayProgressText = document.getElementById('day-progress-text');
const hourProgressText = document.getElementById('hour-progress-text');
const breakReminder = document.getElementById('break-reminder');
const closeReminder = document.getElementById('close-reminder');
const particles = document.getElementById('particles');

const overlay = document.getElementById('overlay');
const closeModalButton = document.getElementById('closeModalButton');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const modalSalary = document.getElementById('modal-salary');
const modalWorkDays = document.getElementById('modal-workDays');
const modalWorkHours = document.getElementById('modal-workHours');
const modalWorkMinutes = document.getElementById('modal-workMinutes');

let monthlySalary = 0;
let workDaysPerMonth = 22;
let workHoursPerDay = 8;
let workMinutesPerDay = 0;
let secondRate = 0;
let currentEarnings = 0;
let todayEarnings = 0;
let dailyIncomeValue = 0;
let startTime = null;
let workStartTime = null;
let elapsedSeconds = 0;
let isRunning = false;
let animationFrameId = null;
let lastCoinTime = 0;
let breakReminderShown = false;
let workDoneNotificationShown = false;
let totalDailyWorkSeconds = 0;

function parseInput() {
    monthlySalary = parseFloat(document.getElementById('salary').value) || 0;
    workDaysPerMonth = parseInt(document.getElementById('workDays').value) || 22;
    workHoursPerDay = parseInt(document.getElementById('workHours').value) || 8;
    workMinutesPerDay = parseInt(document.getElementById('workMinutes').value) || 0;

    // 计算每天工作的总秒数
    totalDailyWorkSeconds = (workHoursPerDay * 3600) + (workMinutesPerDay * 60);
    
    // 如果总工作秒数为0（即每天工作0小时0分钟），则设置为默认值8小时
    if (totalDailyWorkSeconds === 0) {
        workHoursPerDay = 8;
        workMinutesPerDay = 0;
        totalDailyWorkSeconds = 8 * 3600;
    }
    
    // 计算每月工作的总秒数
    const totalMonthlyWorkSeconds = totalDailyWorkSeconds * workDaysPerMonth;
    
    secondRate = monthlySalary / totalMonthlyWorkSeconds;
    dailyIncomeValue = (monthlySalary / workDaysPerMonth);
    
    perSecond.textContent = `¥${secondRate.toFixed(6)}`;
    dailyIncome.textContent = `¥${formatNumber(dailyIncomeValue.toFixed(2))}`;
    
    // 初始化剩余时间显示
    updateRemainingTime();
}

function updateRemainingTime() {
    if (elapsedSeconds >= totalDailyWorkSeconds) {
        remainingTime.textContent = "已完成!";
        remainingTime.classList.add('text-green-600');
        return;
    }
    
    const remainingSeconds = totalDailyWorkSeconds - elapsedSeconds;
    const hours = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(remainingSeconds % 60).toString().padStart(2, '0');
    
    remainingTime.textContent = `${hours}:${minutes}:${seconds}`;
    remainingTime.classList.remove('text-green-600');
    
    // 如果剩余时间小于30分钟，显示红色提醒
    if (remainingSeconds < 1800) {
        remainingTime.classList.add('text-red-500');
    } else {
        remainingTime.classList.remove('text-red-500');
    }
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Update displayed earnings
function updateEarnings() {
    if (isRunning) {
        const now = new Date();
        const timeDiff = (now - startTime) / 1000;
        const previousElapsedSeconds = elapsedSeconds;
        elapsedSeconds += timeDiff;
        startTime = now;

        // 检查是否到达或超过工作时间
        if (elapsedSeconds >= totalDailyWorkSeconds && previousElapsedSeconds < totalDailyWorkSeconds) {
            // 只有当刚好到达工作时间时才触发自动暂停和通知
            autoPauseAndNotify();
        }

        currentEarnings += secondRate * timeDiff;
        todayEarnings += secondRate * timeDiff;
        
        // 计算今天已经赚取的百分比
        const dailyEarningPercentage = (todayEarnings / dailyIncomeValue * 100).toFixed(1);

        const intPart = Math.floor(currentEarnings);
        const decPart = Math.floor((currentEarnings - intPart) * 100).toString().padStart(2, '0');

        // Update integer part only if it changes
        if (parseInt(salaryInteger.textContent.replace(/,/g, ''), 10) !== intPart) {
            salaryInteger.textContent = formatNumber(intPart);

            // Temporarily add and remove a CSS class for a subtle effect
            salaryInteger.classList.add('text-green-700');
            setTimeout(() => {
                salaryInteger.classList.remove('text-green-700');
            }, 300);
        }

        // Always update the decimal part
        salaryDecimal.textContent = decPart;
        
        // 更新进度
        const dayProgress = Math.min(100, (elapsedSeconds / totalDailyWorkSeconds * 100));
        dayProgressBar.style.width = `${dayProgress.toFixed(1)}%`;
        dayProgressText.textContent = `${dayProgress.toFixed(1)}%`;

        const secondsInHour = 3600;
        const hourProgress = Math.min(100, (elapsedSeconds % secondsInHour) / secondsInHour * 100);
        hourProgressBar.style.width = `${hourProgress.toFixed(1)}%`;
        hourProgressText.textContent = `${hourProgress.toFixed(1)}%`;

        // 更新已工作时间
        const hours = Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0');
        const seconds = Math.floor(elapsedSeconds % 60).toString().padStart(2, '0');
        timeWorked.textContent = `${hours}:${minutes}:${seconds}`;
        
        // 更新下班剩余时间
        updateRemainingTime();

        // 创建金币特效 - 每隔一段时间随机出现
        const currentTime = now.getTime();
        if (currentTime - lastCoinTime > 5000 + Math.random() * 5000) {
            createCoin();
            lastCoinTime = currentTime;
        }

        // 休息提醒 - 只在工作满1小时时显示一次
        if (!breakReminderShown && elapsedSeconds >= 3600) {
            showBreakReminder();
            breakReminderShown = true;
        }

        // 创建粒子特效 - 随机出现
        if (Math.random() < 0.1) {
            createParticle();
        }
    }
    animationFrameId = requestAnimationFrame(updateEarnings);
}

function autoPauseAndNotify() {
    // 暂停计时
    isRunning = false;
    
    // 更新暂停按钮状态
    pauseButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        继续
    `;

    pauseButton.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    pauseButton.classList.add('bg-green-500', 'hover:bg-green-600');
    
    // 显示完成通知（如果尚未显示）
    if (!workDoneNotificationShown) {
        showWorkDoneNotification();
        workDoneNotificationShown = true;
    }
}

function showWorkDoneNotification() {
    // 创建下班通知
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg animate__animated animate__bounceIn';
    notification.style.zIndex = '50';
    notification.innerHTML = `
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <p class="font-medium">恭喜！您已完成今日工作，美美下班噜。</p>
                <p class="text-sm">今日收入：${dailyIncome.textContent}</p>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // 大量金币雨效果
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            createCoin();
        }, i * 100);
    }
    
    // 10移除通知
    setTimeout(() => {
        notification.classList.remove('animate__bounceIn');
        notification.classList.add('animate__fadeOut');
        setTimeout(() => {
            notification.remove();
        }, 1000);
    }, 10000);
}

function startEarning() {
    parseInput();

    if (monthlySalary <= 0 || isNaN(monthlySalary)) {
        alert('请输入有效的月薪金额');
        return;
    }

    if (totalDailyWorkSeconds <= 0) {
        alert('请设置有效的工作时间');
        return;
    }

    inputForm.classList.add('animate-fadeOutDown');
    setTimeout(() => {
        inputForm.classList.add('hidden');
        resultSection.classList.remove('hidden');
        resultSection.classList.add('animate__animated', 'animate__fadeInUp');

        startTime = new Date();
        workStartTime = new Date(); // 记录工作开始时间
        
        // 重置通知状态
        breakReminderShown = false;
        workDoneNotificationShown = false;
        
        isRunning = true;
        updateEarnings();

        for (let i = 0; i < 10; i++) {
            createParticle();
        }
    }, 800);
}

function togglePause() {
    isRunning = !isRunning;
    
    if (isRunning) {
        startTime = new Date(); // 重置开始时间
    }
    
    pauseButton.innerHTML = isRunning ? `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        暂停
    ` : `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        继续
    `;

    pauseButton.classList.toggle('bg-yellow-500', isRunning);
    pauseButton.classList.toggle('hover:bg-yellow-600', isRunning);
    pauseButton.classList.toggle('bg-green-500', !isRunning);
    pauseButton.classList.toggle('hover:bg-green-600', !isRunning);
    
    if (isRunning) {
        pauseButton.classList.add('animate__animated', 'animate__pulse');
        setTimeout(() => {
            pauseButton.classList.remove('animate__animated', 'animate__pulse');
        }, 1000);
    }
}

function goBack() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);

    currentEarnings = 0;
    todayEarnings = 0;
    dailyIncomeValue = 0;
    elapsedSeconds = 0;
    breakReminderShown = false;
    workDoneNotificationShown = false;
    workStartTime = null;
    totalDailyWorkSeconds = 0;

    resultSection.classList.remove('animate__fadeInUp');
    resultSection.classList.add('animate__animated', 'animate__fadeOutDown');
    setTimeout(() => {
        resultSection.classList.add('hidden');
        inputForm.classList.remove('hidden', 'animate-fadeOutDown');
        inputForm.classList.add('animate__animated', 'animate__fadeInUp');

        pauseButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            暂停
        `;

        pauseButton.classList.remove('bg-green-500', 'hover:bg-green-600');
        pauseButton.classList.add('bg-yellow-500', 'hover:bg-yellow-600');

        salaryInteger.textContent = "0";
        salaryDecimal.textContent = "00";
        dailyIncome.textContent = "¥0.00";
        perSecond.textContent = "¥0.00";
        timeWorked.textContent = "00:00:00";
        remainingTime.textContent = "--:--:--";
        remainingTime.classList.remove('text-red-500', 'text-green-600');
        dayProgressBar.style.width = "0%";
        dayProgressText.textContent = "0%";
        hourProgressBar.style.width = "0%";
        hourProgressText.textContent = "0%";

        document.querySelectorAll('.coin').forEach(coin => coin.remove());
        particles.innerHTML = '';

        document.getElementById('salary').value = "";
        document.getElementById('workDays').value = "22";
        document.getElementById('workHours').value = "8";
        document.getElementById('workMinutes').value = "0";
    }, 800);
}

function openSettings() {
    overlay.classList.add('show');
    modalSalary.value = monthlySalary;
    modalWorkDays.value = workDaysPerMonth;
    modalWorkHours.value = workHoursPerDay;
    modalWorkMinutes.value = workMinutesPerDay;
}

function saveSettings() {
    monthlySalary = parseFloat(modalSalary.value) || 0;
    workDaysPerMonth = parseInt(modalWorkDays.value) || 22;
    workHoursPerDay = parseInt(modalWorkHours.value) || 0;
    workMinutesPerDay = parseInt(modalWorkMinutes.value) || 0;

    // 计算每天工作的总秒数
    totalDailyWorkSeconds = (workHoursPerDay * 3600) + (workMinutesPerDay * 60);
    
    // 如果总工作秒数为0（即每天工作0小时0分钟），则设置为默认值8小时
    if (totalDailyWorkSeconds === 0) {
        workHoursPerDay = 8;
        workMinutesPerDay = 0;
        totalDailyWorkSeconds = 8 * 3600;
        modalWorkHours.value = 8;
        modalWorkMinutes.value = 0;
    }
    
    // 计算每月工作的总秒数
    const totalMonthlyWorkSeconds = totalDailyWorkSeconds * workDaysPerMonth;
    
    secondRate = monthlySalary / totalMonthlyWorkSeconds;
    dailyIncomeValue = (monthlySalary / workDaysPerMonth);
    
    perSecond.textContent = `¥${secondRate.toFixed(6)}`;
    dailyIncome.textContent = `¥${formatNumber(dailyIncomeValue.toFixed(2))}`;
    
    // 重置通知状态 - 如果设置发生变化，应该允许通知再次显示
    if (elapsedSeconds >= totalDailyWorkSeconds) {
        // 如果已经超过工作时间，立即暂停并显示通知
        if (isRunning && !workDoneNotificationShown) {
            autoPauseAndNotify();
        }
    } else {
        // 如果尚未达到工作时间，重置通知状态
        workDoneNotificationShown = false;
    }
    
    // 更新剩余时间
    updateRemainingTime();

    overlay.classList.remove('show');
}

function shareEarnings() {
    const percentComplete = dayProgressText.textContent;
    const remainingTimeText = remainingTime.textContent;
    let text;
    
    if (elapsedSeconds >= totalDailyWorkSeconds) {
        text = `我的日薪是${dailyIncome.textContent}，每秒赚${perSecond.textContent}！今天工作已经完成，下班啦！`;
    } else {
        text = `我的日薪是${dailyIncome.textContent}，每秒赚${perSecond.textContent}！今天已完成${percentComplete}的工作，还有${remainingTimeText}就能下班了！`;
    }
    
    if (navigator.share) {
        navigator.share({
            title: '我的实时工资',
            text: text,
            url: window.location.href
        })
            .catch(error => console.log('分享失败:', error));
    } else {
        prompt('复制以下文本分享您的收益:', text);
    }
}

function createCoin() {
    const coin = document.createElement('div');
    coin.className = 'coin animate__animated animate__flip animate__infinite';
    coin.style.left = `${Math.random() * 100}%`;
    document.body.appendChild(coin);

    setTimeout(() => {
        coin.remove();
    }, 4000);
}

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = 5 + Math.random() * 15;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;

    const duration = 15 + Math.random() * 20;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `-${Math.random() * duration}s`;

    particles.appendChild(particle);

    if (particles.children.length > 50) {
        particles.removeChild(particles.firstChild);
    }
}

function showBreakReminder() {
    breakReminder.classList.add('animate__animated', 'animate__bounceIn');
    breakReminder.style.transform = 'scale(1)';
    breakReminder.style.opacity = '1';

    setTimeout(() => {
        hideBreakReminder();
    }, 10000);
}

function hideBreakReminder() {
    breakReminder.classList.remove('animate__bounceIn');
    breakReminder.classList.add('animate__fadeOut');
    setTimeout(() => {
        breakReminder.style.transform = 'scale(0)';
        breakReminder.style.opacity = '0';
        breakReminder.classList.remove('animate__fadeOut');
    }, 1000);
}

startButton.addEventListener('click', startEarning);
pauseButton.addEventListener('click', togglePause);
backButton.addEventListener('click', goBack);
settingsButton.addEventListener('click', openSettings);
shareButton.addEventListener('click', shareEarnings);
closeReminder.addEventListener('click', hideBreakReminder);

closeModalButton.addEventListener('click', () => overlay.classList.remove('show'));
saveSettingsButton.addEventListener('click', saveSettings);

document.getElementById('salary').addEventListener('input', function (e) {
    if (e.target.value < 0) e.target.value = 0;
    if (e.target.value > 1000000) e.target.value = 1000000;
});

document.getElementById('workDays').addEventListener('input', function (e) {
    if (e.target.value < 1) e.target.value = 1;
    if (e.target.value > 31) e.target.value = 31;
});

document.getElementById('workHours').addEventListener('input', function (e) {
    if (e.target.value < 0) e.target.value = 0;
    if (e.target.value > 24) e.target.value = 24;
});

document.getElementById('workMinutes').addEventListener('input', function (e) {
    if (e.target.value < 0) e.target.value = 0;
    if (e.target.value > 59) e.target.value = 59;
});

// 添加验证工作时间的函数
function validateWorkTime() {
    const hours = parseInt(document.getElementById('workHours').value) || 0;
    const minutes = parseInt(document.getElementById('workMinutes').value) || 0;
    
    if (hours === 0 && minutes === 0) {
        document.getElementById('workHours').value = 8;
    }
}

// 为工作时间输入框添加blur事件监听器
document.getElementById('workHours').addEventListener('blur', validateWorkTime);
document.getElementById('workMinutes').addEventListener('blur', validateWorkTime);

// 同样为模态窗口中的工作时间输入框添加相同的验证
modalWorkHours.addEventListener('blur', function() {
    if ((parseInt(modalWorkHours.value) || 0) === 0 && (parseInt(modalWorkMinutes.value) || 0) === 0) {
        modalWorkHours.value = 8;
    }
});

modalWorkMinutes.addEventListener('blur', function() {
    if ((parseInt(modalWorkHours.value) || 0) === 0 && (parseInt(modalWorkMinutes.value) || 0) === 0) {
        modalWorkHours.value = 8;
    }
});
