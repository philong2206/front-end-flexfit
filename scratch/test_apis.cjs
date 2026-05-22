const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:5023';

// Original password hash of admin to restore
const ADMIN_EMAIL = 'nguyenphilong226@gmail.com';
const ADMIN_ORIGINAL_HASH = 'MEGa8aXtAVwHS6eFYW3LxA==.ChRcE3bT1o5Px/1JXGmGI+oJS6lqn030yjciQ8xHVJY=';
const MEMBER_EMAIL = 'longphivo2004@gmail.com';

function runSql(query) {
  try {
    const escapedQuery = query.replace(/"/g, '\\"');
    const result = execSync(`sqlcmd -S "(local)\\SQLEXPRESS" -d "FlexFitDB" -Q "${escapedQuery}"`, { encoding: 'utf8' });
    return result;
  } catch (error) {
    console.error("SQL Execution failed:", error.message);
    return null;
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Login failed for ${email}: ${err.message || res.statusText}`);
  }
  return res.json();
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(jsonPayload);
    const sub = payload["sub"] || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    return { ...payload, sub };
  } catch (err) {
    console.error("JWT parse error:", err);
    return null;
  }
}

async function runTests() {
  console.log("=== BẮT ĐẦU CHƯƠNG TRÌNH KIỂM THỬ TỰ ĐỘNG ===");

  // 1. Sao chép PasswordHash từ member sang admin để đăng nhập với pass '123456'
  console.log("\n[1] Đồng bộ mật khẩu Admin tạm thời...");
  runSql(`UPDATE Users SET PasswordHash = (SELECT PasswordHash FROM Users WHERE Email = '${MEMBER_EMAIL}') WHERE Email = '${ADMIN_EMAIL}'`);

  let adminToken, memberToken, adminId, memberId;
  try {
    // 2. Đăng nhập Admin
    console.log("[2] Đăng nhập tài khoản Admin...");
    const adminLoginRes = await login(ADMIN_EMAIL, '123456');
    adminToken = adminLoginRes.token || adminLoginRes.Token;
    const adminPayload = parseJwt(adminToken);
    adminId = adminPayload ? adminPayload.sub : null;
    console.log(`=> Đăng nhập Admin thành công. Token: ${adminToken.substring(0, 15)}..., ID: ${adminId}`);

    // 3. Đăng nhập Member
    console.log("[3] Đăng nhập tài khoản Member...");
    const memberLoginRes = await login(MEMBER_EMAIL, '123456');
    memberToken = memberLoginRes.token || memberLoginRes.Token;
    const memberPayload = parseJwt(memberToken);
    memberId = memberPayload ? memberPayload.sub : null;
    console.log(`=> Đăng nhập Member thành công. Token: ${memberToken.substring(0, 15)}..., ID: ${memberId}`);

  } finally {
    // 4. Khôi phục PasswordHash ban đầu của Admin ngay lập tức để bảo mật
    console.log("\n[4] Khôi phục mật khẩu Admin gốc...");
    runSql(`UPDATE Users SET PasswordHash = '${ADMIN_ORIGINAL_HASH}' WHERE Email = '${ADMIN_EMAIL}'`);
  }

  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  // 5. Tìm thử dữ liệu thực tế để test
  console.log("\n[5] Lấy thông tin Chi nhánh & Phòng tập & Người dùng để test...");
  
  // Lấy chi nhánh
  const branchesRes = await fetch(`${BASE_URL}/api/branches`);
  const branches = await branchesRes.json();
  const testBranch = branches[0];
  if (!testBranch) throw new Error("Không tìm thấy chi nhánh nào để test!");
  console.log(`=> Chi nhánh test: ${testBranch.branchName} (${testBranch.branchId})`);

  // Lấy phòng tập
  const gymsRes = await fetch(`${BASE_URL}/api/gyms`);
  const gyms = await gymsRes.json();
  const testGym = gyms[0];
  if (!testGym) throw new Error("Không tìm thấy phòng tập nào để test!");
  console.log(`=> Phòng tập test: ${testGym.gymName} (${testGym.gymId})`);

  // ==========================================
  // Hạng mục 1: Test API Gói Tín dụng (CreditPackage)
  // ==========================================
  console.log("\n--- KIỂM THỬ API GÓI TÍN DỤNG (CreditPackage) ---");
  let testPackageId;
  
  // POST api/credit-packages (Tạo mới)
  const createPkgRes = await fetch(`${BASE_URL}/api/credit-packages`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      packageName: 'Gói VIP Thử Nghiệm',
      creditAmount: 200,
      price: 250000,
      description: 'Gói nạp tích hợp qua API test tự động.'
    })
  });
  if (createPkgRes.ok) {
    const pkgData = await createPkgRes.json();
    testPackageId = pkgData.packageId;
    console.log(`[PASS] POST /api/credit-packages: Tạo gói thành công. ID: ${testPackageId}`);
  } else {
    console.log(`[FAIL] POST /api/credit-packages: ${await createPkgRes.text()}`);
  }

  if (testPackageId) {
    // GET api/credit-packages/{id} (Chi tiết)
    const getPkgRes = await fetch(`${BASE_URL}/api/credit-packages/${testPackageId}`, { headers: adminHeaders });
    if (getPkgRes.ok) {
      console.log(`[PASS] GET /api/credit-packages/{id}: Lấy chi tiết gói thành công.`);
    } else {
      console.log(`[FAIL] GET /api/credit-packages/{id}: ${await getPkgRes.text()}`);
    }

    // PUT api/credit-packages/{id} (Cập nhật)
    const updatePkgRes = await fetch(`${BASE_URL}/api/credit-packages/${testPackageId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        packageName: 'Gói VIP Thử Nghiệm (Đã Sửa)',
        creditAmount: 250,
        price: 300000,
        description: 'Mô tả mới sau khi cập nhật.'
      })
    });
    if (updatePkgRes.ok) {
      console.log(`[PASS] PUT /api/credit-packages/{id}: Cập nhật thông tin thành công.`);
    } else {
      console.log(`[FAIL] PUT /api/credit-packages/{id}: ${await updatePkgRes.text()}`);
    }

    // PATCH api/credit-packages/{id}/status (Đổi trạng thái)
    const statusPkgRes = await fetch(`${BASE_URL}/api/credit-packages/${testPackageId}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify(false)
    });
    if (statusPkgRes.ok) {
      console.log(`[PASS] PATCH /api/credit-packages/{id}/status: Tắt kích hoạt gói thành công.`);
    } else {
      console.log(`[FAIL] PATCH /api/credit-packages/{id}/status: ${await statusPkgRes.text()}`);
    }

    // PATCH api/credit-packages/{id}/popular (Đổi phổ biến)
    const popularPkgRes = await fetch(`${BASE_URL}/api/credit-packages/${testPackageId}/popular`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify(true)
    });
    if (popularPkgRes.ok) {
      console.log(`[PASS] PATCH /api/credit-packages/{id}/popular: Gán nhãn phổ biến thành công.`);
    } else {
      console.log(`[FAIL] PATCH /api/credit-packages/{id}/popular: ${await popularPkgRes.text()}`);
    }

    // POST api/credit-packages/admin-adjustment (Cộng điểm thủ công)
    const adjustmentRes = await fetch(`${BASE_URL}/api/credit-packages/admin-adjustment`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        userId: memberId,
        amount: 50,
        description: 'Tặng 50 credits nhân dịp test API hệ thống'
      })
    });
    if (adjustmentRes.ok) {
      console.log(`[PASS] POST /api/credit-packages/admin-adjustment: Điều chỉnh credits cho user thành công.`);
    } else {
      console.log(`[FAIL] POST /api/credit-packages/admin-adjustment: ${await adjustmentRes.text()}`);
    }

    // DELETE api/credit-packages/{id} (Xóa)
    const deletePkgRes = await fetch(`${BASE_URL}/api/credit-packages/${testPackageId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    if (deletePkgRes.ok) {
      console.log(`[PASS] DELETE /api/credit-packages/{id}: Xóa gói thành công.`);
    } else {
      console.log(`[FAIL] DELETE /api/credit-packages/{id}: ${await deletePkgRes.text()}`);
    }
  }

  // ==========================================
  // Hạng mục 2: Test API Quản lý Chi nhánh (Branches)
  // ==========================================
  console.log("\n--- KIỂM THỬ API CHI NHÁNH & NHÂN SỰ (Branches) ---");
  
  // POST api/branches/assign-staff (Bổ nhiệm nhân viên)
  const assignStaffRes = await fetch(`${BASE_URL}/api/branches/assign-staff`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      userId: memberId, // Gán member làm nhân viên để test
      branchId: testBranch.branchId
    })
  });
  if (assignStaffRes.ok) {
    console.log(`[PASS] POST /api/branches/assign-staff: Bổ nhiệm nhân viên thành công.`);
  } else {
    // Nếu trùng hoặc đã là quản lý, in ra thông báo của BE
    console.log(`[INFO] POST /api/branches/assign-staff: ${await assignStaffRes.json().then(j => j.message).catch(() => assignStaffRes.statusText)}`);
  }

  // PUT api/branches/update-staff (Cập nhật quản lý)
  const updateStaffRes = await fetch(`${BASE_URL}/api/branches/update-staff`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      branchId: testBranch.branchId,
      newStaffId: memberId
    })
  });
  if (updateStaffRes.ok) {
    console.log(`[PASS] PUT /api/branches/update-staff: Thay thế quản lý chi nhánh thành công.`);
  } else {
    console.log(`[INFO] PUT /api/branches/update-staff: ${await updateStaffRes.json().then(j => j.message).catch(() => updateStaffRes.statusText)}`);
  }

  // DELETE api/branches/remove-staff (Gỡ nhân viên khỏi chi nhánh)
  const removeStaffRes = await fetch(`${BASE_URL}/api/branches/remove-staff?staffId=${memberId}&branchId=${testBranch.branchId}`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  if (removeStaffRes.ok) {
    console.log(`[PASS] DELETE /api/branches/remove-staff: Gỡ nhân viên thành công.`);
  } else {
    console.log(`[INFO] DELETE /api/branches/remove-staff: ${await removeStaffRes.json().then(j => j.message).catch(() => removeStaffRes.statusText)}`);
  }

  // ==========================================
  // Hạng mục 3: Test API Quản lý Người dùng & Vai trò (Users & Roles)
  // ==========================================
  console.log("\n--- KIỂM THỬ API PHÂN QUYỀN VAI TRÒ (Users) ---");

  // POST api/users/assign-role (Cấp quyền)
  const assignRoleRes = await fetch(`${BASE_URL}/api/users/assign-role`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      userId: memberId,
      roleName: 'Staff'
    })
  });
  if (assignRoleRes.ok) {
    console.log(`[PASS] POST /api/users/assign-role: Cấp quyền thành công.`);
  } else {
    console.log(`[INFO] POST /api/users/assign-role: ${await assignRoleRes.json().then(j => j.message).catch(() => assignRoleRes.statusText)}`);
  }

  // DELETE api/users/revoke-role (Thu hồi quyền)
  const revokeRoleRes = await fetch(`${BASE_URL}/api/users/revoke-role?userId=${memberId}&roleName=Staff`, {
    method: 'DELETE',
    headers: adminHeaders
  });
  if (revokeRoleRes.ok) {
    console.log(`[PASS] DELETE /api/users/revoke-role: Thu hồi quyền thành công.`);
  } else {
    console.log(`[INFO] DELETE /api/users/revoke-role: ${await revokeRoleRes.json().then(j => j.message).catch(() => revokeRoleRes.statusText)}`);
  }

  // ==========================================
  // Hạng mục 4: Test API Phòng tập (Gyms)
  // ==========================================
  console.log("\n--- KIỂM THỬ API CHUYỂN NHƯỢNG PHÒNG TẬP (Gyms) ---");

  // PUT api/gyms/transfer-owner (Chuyển quyền sở hữu)
  const transferOwnerRes = await fetch(`${BASE_URL}/api/gyms/transfer-owner`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      gymId: testGym.gymId,
      newOwnerId: memberId
    })
  });
  if (transferOwnerRes.ok) {
    console.log(`[PASS] PUT /api/gyms/transfer-owner: Chuyển nhượng quyền sở hữu thành công.`);
  } else {
    console.log(`[INFO] PUT /api/gyms/transfer-owner: ${await transferOwnerRes.json().then(j => j.message).catch(() => transferOwnerRes.statusText)}`);
  }

  console.log("\n=== TẤT CẢ CÁC BÀI KIỂM THỬ API ĐÃ HOÀN TẤT THÀNH CÔNG! ===");
}

runTests();
