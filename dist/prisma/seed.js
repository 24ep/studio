"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminEmail, adminPassword, stages, _i, stages_1, stage, userGroups, _a, userGroups_1, group, adminUser, notificationChannels, _b, notificationChannels_1, channel, notificationEvents, _c, notificationEvents_1, event;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    adminEmail = 'admin@ncc.com';
                    adminPassword = '$2a$10$dwiCxbUtCqnXeB2O8BmiyeWHL0e7rOqahafQAUACsnD4EZ9nGqPx2';
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: adminEmail },
                            update: {},
                            create: {
                                name: 'Admin User',
                                email: adminEmail,
                                password: adminPassword,
                                role: 'Admin',
                                modulePermissions: [
                                    'CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'CANDIDATES_IMPORT', 'CANDIDATES_EXPORT', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT', 'USERS_MANAGE', 'USER_GROUPS_MANAGE', 'SYSTEM_SETTINGS_MANAGE', 'USER_PREFERENCES_MANAGE', 'RECRUITMENT_STAGES_MANAGE', 'CUSTOM_FIELDS_MANAGE', 'WEBHOOK_MAPPING_MANAGE', 'NOTIFICATION_SETTINGS_MANAGE', 'LOGS_VIEW'
                                ]
                            }
                        })];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, prisma.position.upsert({
                            where: { id: '11111111-1111-1111-1111-111111111111' },
                            update: {},
                            create: {
                                id: '11111111-1111-1111-1111-111111111111',
                                title: 'Software Engineer',
                                department: 'Engineering',
                                description: 'Develops and maintains software.'
                            }
                        })];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, prisma.position.upsert({
                            where: { id: '22222222-2222-2222-2222-222222222222' },
                            update: {},
                            create: {
                                id: '22222222-2222-2222-2222-222222222222',
                                title: 'Product Manager',
                                department: 'Product',
                                description: 'Oversees product development.'
                            }
                        })];
                case 3:
                    _d.sent();
                    stages = [
                        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Applied', description: 'Candidate has submitted their application', is_system: true, sort_order: 1 },
                        { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Screening', description: 'Initial screening of candidate qualifications', is_system: true, sort_order: 2 },
                        { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Shortlisted', description: 'Candidate has been shortlisted for further consideration', is_system: true, sort_order: 3 },
                        { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Interview Scheduled', description: 'Interview has been scheduled with the candidate', is_system: true, sort_order: 4 },
                        { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Interviewing', description: 'Candidate is currently in the interview process', is_system: true, sort_order: 5 },
                        { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Offer Extended', description: 'Job offer has been extended to the candidate', is_system: true, sort_order: 6 },
                        { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Offer Accepted', description: 'Candidate has accepted the job offer', is_system: true, sort_order: 7 },
                        { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Hired', description: 'Candidate has been hired and started employment', is_system: true, sort_order: 8 },
                        { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Rejected', description: 'Candidate has been rejected from the process', is_system: true, sort_order: 9 },
                        { id: '550e8400-e29b-41d4-a716-446655440010', name: 'On Hold', description: 'Candidate application is temporarily on hold', is_system: true, sort_order: 10 }
                    ];
                    _i = 0, stages_1 = stages;
                    _d.label = 4;
                case 4:
                    if (!(_i < stages_1.length)) return [3 /*break*/, 7];
                    stage = stages_1[_i];
                    return [4 /*yield*/, prisma.recruitmentStage.upsert({
                            where: { name: stage.name },
                            update: {},
                            create: stage
                        })];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    userGroups = [
                        {
                            id: '00000000-0000-0000-0000-000000000001',
                            name: 'Admin',
                            description: 'Full system access',
                            permissions: [
                                'CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'CANDIDATES_IMPORT', 'CANDIDATES_EXPORT', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT', 'USERS_MANAGE', 'USER_GROUPS_MANAGE', 'SYSTEM_SETTINGS_MANAGE', 'USER_PREFERENCES_MANAGE', 'RECRUITMENT_STAGES_MANAGE', 'CUSTOM_FIELDS_MANAGE', 'WEBHOOK_MAPPING_MANAGE', 'NOTIFICATION_SETTINGS_MANAGE', 'LOGS_VIEW'
                            ],
                            is_default: true,
                            is_system_role: true
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000002',
                            name: 'Recruiter',
                            description: 'Can manage candidates and positions',
                            permissions: [
                                'CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'CANDIDATES_IMPORT', 'CANDIDATES_EXPORT', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT', 'RECRUITMENT_STAGES_MANAGE'
                            ],
                            is_default: true,
                            is_system_role: false
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000003',
                            name: 'Hiring Manager',
                            description: 'Can view candidates and positions',
                            permissions: [
                                'CANDIDATES_VIEW', 'POSITIONS_VIEW'
                            ],
                            is_default: true,
                            is_system_role: false
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000011',
                            name: 'HR',
                            description: 'HR Department group',
                            permissions: [
                                'HR_MANAGE', 'HR_CREATE', 'HR_UPDATE', 'HR_DELETE'
                            ],
                            is_default: true,
                            is_system_role: false
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000012',
                            name: 'IT',
                            description: 'IT Department group',
                            permissions: [
                                'IT_MANAGE', 'IT_CREATE', 'IT_UPDATE', 'IT_DELETE'
                            ],
                            is_default: true,
                            is_system_role: false
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000013',
                            name: 'Finance',
                            description: 'Finance Department group',
                            permissions: [
                                'FINANCE_MANAGE', 'FINANCE_CREATE', 'FINANCE_UPDATE', 'FINANCE_DELETE'
                            ],
                            is_default: false,
                            is_system_role: false
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000014',
                            name: 'Marketing',
                            description: 'Marketing Department group',
                            permissions: [
                                'MARKETING_MANAGE', 'MARKETING_CREATE', 'MARKETING_UPDATE', 'MARKETING_DELETE'
                            ],
                            is_default: false,
                            is_system_role: false
                        }
                    ];
                    _a = 0, userGroups_1 = userGroups;
                    _d.label = 8;
                case 8:
                    if (!(_a < userGroups_1.length)) return [3 /*break*/, 11];
                    group = userGroups_1[_a];
                    return [4 /*yield*/, prisma.userGroup.upsert({
                            where: { id: group.id },
                            update: {},
                            create: group
                        })];
                case 9:
                    _d.sent();
                    _d.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11: return [4 /*yield*/, prisma.user.findUnique({ where: { email: adminEmail } })];
                case 12:
                    adminUser = _d.sent();
                    if (!adminUser) return [3 /*break*/, 15];
                    return [4 /*yield*/, prisma.user_UserGroup.upsert({
                            where: { userId_groupId: { userId: adminUser.id, groupId: '00000000-0000-0000-0000-000000000001' } },
                            update: {},
                            create: { userId: adminUser.id, groupId: '00000000-0000-0000-0000-000000000001' }
                        })];
                case 13:
                    _d.sent();
                    _d.label = 14;
                case 14:
                    _d.label = 15;
                case 15:
                    notificationChannels = [
                        { id: '10000000-0000-0000-0000-000000000001', channel_key: 'email', label: 'Email' },
                        { id: '10000000-0000-0000-0000-000000000002', channel_key: 'webhook', label: 'Webhook' }
                    ];
                    _b = 0, notificationChannels_1 = notificationChannels;
                    _d.label = 16;
                case 16:
                    if (!(_b < notificationChannels_1.length)) return [3 /*break*/, 19];
                    channel = notificationChannels_1[_b];
                    return [4 /*yield*/, prisma.notificationChannel.upsert({
                            where: { channel_key: channel.channel_key },
                            update: {},
                            create: channel
                        })];
                case 17:
                    _d.sent();
                    _d.label = 18;
                case 18:
                    _b++;
                    return [3 /*break*/, 16];
                case 19:
                    notificationEvents = [
                        { id: '20000000-0000-0000-0000-000000000001', event_key: 'candidate_created', label: 'Candidate Created', description: 'Triggered when a new candidate is created.' },
                        { id: '20000000-0000-0000-0000-000000000002', event_key: 'position_filled', label: 'Position Filled', description: 'Triggered when a position is filled.' },
                        { id: '20000000-0000-0000-0000-000000000003', event_key: 'stage_changed', label: 'Stage Changed', description: 'Triggered when a candidate changes recruitment stage.' }
                    ];
                    _c = 0, notificationEvents_1 = notificationEvents;
                    _d.label = 20;
                case 20:
                    if (!(_c < notificationEvents_1.length)) return [3 /*break*/, 23];
                    event = notificationEvents_1[_c];
                    return [4 /*yield*/, prisma.notificationEvent.upsert({
                            where: { event_key: event.event_key },
                            update: {},
                            create: event
                        })];
                case 21:
                    _d.sent();
                    _d.label = 22;
                case 22:
                    _c++;
                    return [3 /*break*/, 20];
                case 23: return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
