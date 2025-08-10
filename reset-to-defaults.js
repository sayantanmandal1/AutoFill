/**
 * Reset Extension to New Defaults
 * Run this in the browser console to immediately apply the new default values
 */

console.log('🔄 Resetting extension to new default values...');

const newDefaultData = {
    profiles: {
        default: {
            name: "Default Profile",
            data: {
                fullName: "Sayantan Mandal",
                email: "sayantan.22bce8533@vitapstudent.ac.in",
                studentNumber: "22BCE8533",
                phone: "6290464748",
                leetcodeUrl: "https://leetcode.com/u/sayonara1337/",
                linkedinUrl: "https://www.linkedin.com/in/sayantan-mandal-8a14b7202/",
                githubUrl: "https://github.com/sayantanmandal1",
                resumeUrl: "https://drive.google.com/file/d/1e_zGr0Ld9mUR9C1HLHjMGN8aV77l1jcO/view?usp=drive_link",
                portfolioUrl: "https://d1grz986bewgw4.cloudfront.net/",
                customFields: {}
            }
        }
    },
    settings: {
        activeProfile: "default",
        autoFillEnabled: false,
        blacklistedDomains: [],
        passwordProtected: false,
        passwordHash: "",
        passwordSalt: ""
    }
};

// Apply the new defaults
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set(newDefaultData, () => {
        if (chrome.runtime.lastError) {
            console.error('❌ Error setting defaults:', chrome.runtime.lastError);
        } else {
            console.log('✅ Extension reset to new defaults successfully!');
            console.log('📋 Your information is now pre-filled:');
            console.log('   Name:', newDefaultData.profiles.default.data.fullName);
            console.log('   Email:', newDefaultData.profiles.default.data.email);
            console.log('   Student ID:', newDefaultData.profiles.default.data.studentNumber);
            console.log('   Phone:', newDefaultData.profiles.default.data.phone);
            console.log('   LinkedIn:', newDefaultData.profiles.default.data.linkedinUrl);
            console.log('   GitHub:', newDefaultData.profiles.default.data.githubUrl);
            console.log('   LeetCode:', newDefaultData.profiles.default.data.leetcodeUrl);
            console.log('   Resume:', newDefaultData.profiles.default.data.resumeUrl);
            console.log('   Portfolio:', newDefaultData.profiles.default.data.portfolioUrl);
            console.log('\n🎉 You can now use the extension without filling everything again!');
            console.log('💡 Reload the extension popup to see the new values.');
        }
    });
} else {
    console.error('❌ Chrome storage API not available');
    console.log('💡 Make sure you run this in a browser with the extension loaded');
}

// Function to verify the data was set
window.verifyDefaults = function() {
    chrome.storage.sync.get(null, (data) => {
        console.log('📦 Current extension data:', data);
        
        if (data.profiles && data.profiles.default && data.profiles.default.data) {
            const profile = data.profiles.default.data;
            console.log('✅ Profile data verified:');
            console.log('   Full Name:', profile.fullName);
            console.log('   Email:', profile.email);
            console.log('   Student Number:', profile.studentNumber);
            console.log('   Phone:', profile.phone);
            console.log('   All URLs are set:', {
                leetcode: !!profile.leetcodeUrl,
                linkedin: !!profile.linkedinUrl,
                github: !!profile.githubUrl,
                resume: !!profile.resumeUrl,
                portfolio: !!profile.portfolioUrl
            });
        } else {
            console.log('❌ No profile data found');
        }
    });
};

console.log('\n🔧 Run verifyDefaults() to check if the data was set correctly');