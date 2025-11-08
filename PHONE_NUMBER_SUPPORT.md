# Phone Number Authentication Support

## Overview
The authentication system now fully supports both email and phone number registration/login with proper validation and formatting.

## Changes Made

### 1. Enhanced Phone Number Validation (`lib/validations.ts`)
- **Improved regex pattern**: Now requires 10-15 digits for phone numbers
- **Better error messages**: Clear guidance on phone number format
- **New utility functions**:
  - `isPhoneNumber()`: Detects if input is a phone number
  - `isEmail()`: Detects if input is an email
  - `formatPhoneNumber()`: Formats phone numbers to E.164 format (e.g., +11234567890)

### 2. Smart Phone Number Handling (`lib/auth-service.ts`)

#### Registration
- **Auto-detection**: Automatically detects if user entered email or phone number
- **E.164 formatting**: Converts phone numbers to international format
- **Country code handling**:
  - 10 digits (e.g., 9876543210) → Adds +91 (India)
  - 12 digits starting with 91 → Adds + prefix (e.g., 919876543210 → +919876543210)
  - 11 digits starting with 1 → Adds + prefix (US/Canada format)
  - Other formats → Adds + prefix
- **Backend compatibility**: Sends phone numbers in `phone_number` field, emails in `email` field

#### Login
- **Same auto-detection**: Works seamlessly for both login and registration
- **Format preservation**: Ensures phone numbers are sent in correct format

### 3. User Interface Improvements

#### Register Form (`components/auth/register-form.tsx`)
- **Better placeholder**: "email@example.com or +919876543210"
- **Helpful hint**: Shows phone format requirements below input (e.g., 9876543210 or +919876543210)
- **Dynamic feedback**: Only shows hint when no errors present

#### Login Form (`components/auth/login-form.tsx`)
- **Clear placeholder**: "email@example.com, username, or +919876543210"
- **Format guidance**: Same helpful hint for phone numbers with Indian examples

## Phone Number Format Examples

### Accepted Formats
✅ `9876543210` (10 digits - adds +91 automatically for India)
✅ `919876543210` (12 digits starting with 91 - adds + automatically)
✅ `+919876543210` (E.164 format with country code)
✅ `+442071234567` (International format - UK)
✅ `+11234567890` (International format - US/Canada)
✅ `98765-43210` (Formatted - auto-cleaned and converted)
✅ `(987) 654-3210` (Formatted - auto-cleaned and converted)

### Rejected Formats
❌ `123456789` (Less than 10 digits)
❌ `abc123def456` (Contains letters)
❌ `123 456 789` (Less than 10 digits)

## How It Works

### Registration Flow
1. User enters phone number (any format)
2. Frontend validates: Must be 10-15 digits
3. Frontend formats to E.164: `+919876543210`
4. Backend receives: `{ phone_number: "+919876543210", username: "John Doe", password: "..." }`
5. AWS Cognito processes phone registration

### Login Flow
1. User enters phone number (any format)
2. Frontend formats to E.164: `+919876543210`
3. Backend receives: `{ username: "+919876543210", password: "..." }`
4. AWS Cognito authenticates

## Backend Requirements

Your backend should handle:
- `phone_number` field for phone registrations
- `email` field for email registrations
- `username` field can accept both emails and formatted phone numbers for login

## Testing

### Test Phone Numbers (for development)
- India (10 digits): `9876543210` → becomes `+919876543210`
- India with country code: `919876543210` → becomes `+919876543210`
- India with +: `+919876543210` → stays `+919876543210`
- US: `11234567890` → becomes `+11234567890`
- UK: `+442071234567` → stays `+442071234567`

### Test Cases
1. **Registration with email**: ✅ Works as before
2. **Registration with phone (10 digits)**: ✅ Auto-formats to +91XXXXXXXXXX
3. **Registration with phone (12 digits with 91)**: ✅ Auto-formats to +91XXXXXXXXXX
4. **Registration with phone (+country code)**: ✅ Preserves format
5. **Login with email**: ✅ Works as before
6. **Login with phone**: ✅ Auto-formats and authenticates

## Error Handling

### Common Errors and Solutions

**Error: "Invalid email address format"**
- **Cause**: Backend not accepting phone_number field
- **Solution**: Ensure backend supports `phone_number` field in signup endpoint

**Error: "Please enter a valid email address or phone number (10-15 digits)"**
- **Cause**: Phone number has less than 10 digits or contains invalid characters
- **Solution**: Enter at least 10 digits, numbers only (formatting characters OK)

## Console Logging

For debugging, the system logs:
- `[Auth] Registering with phone number: +919876543210`
- `[Auth] Registering with email: user@example.com`
- `[Auth] Logging in with phone number: +919876543210`
- `[Auth] Logging in with email: user@example.com`

## Security Considerations

1. **E.164 Format**: Standardized international phone format
2. **Country Code**: Automatically adds +91 for Indian numbers (default)
3. **Multi-country Support**: Also supports US/Canada (+1), UK (+44), and other international formats
4. **Validation**: Prevents invalid phone numbers from being submitted
5. **Backend Verification**: Backend should still validate phone numbers

## Backward Compatibility

- ✅ Existing email authentication unchanged
- ✅ All previous functionality preserved
- ✅ Only adds new phone number support
- ✅ No breaking changes

## Next Steps

If you encounter issues:
1. Check browser console for debug logs
2. Verify backend accepts `phone_number` field
3. Ensure AWS Cognito user pool has phone number authentication enabled
4. Test with valid phone number formats (10+ digits)

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify phone number has 10+ digits
- Ensure backend is configured for phone authentication
- Contact support with console logs if issues persist

