package auth

import (
	"crypto/rand"
	"encoding/base32"
	"fmt"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

// MFAService handles Multi-Factor Authentication
type MFAService struct {
	issuer string
}

// NewMFAService creates a new MFA service instance
func NewMFAService(issuer string) *MFAService {
	return &MFAService{
		issuer: issuer,
	}
}

// GenerateSecret generates a new TOTP secret
func (s *MFAService) GenerateSecret() (string, error) {
	secret := make([]byte, 20)
	if _, err := rand.Read(secret); err != nil {
		return "", fmt.Errorf("failed to generate secret: %w", err)
	}
	return base32.StdEncoding.EncodeToString(secret), nil
}

// GenerateQRCode generates a QR code for TOTP setup
func (s *MFAService) GenerateQRCode(accountName, secret string) (string, error) {
	key, err := otp.NewKey(totp.KeyURI(accountName, s.issuer, secret, otp.AlgorithmSHA1, 6, 30))
	if err != nil {
		return "", fmt.Errorf("failed to generate TOTP key URI: %w", err)
	}
	return key.QRCode(), nil
}

// ValidateTOTP validates a TOTP code against a secret
func (s *MFAService) ValidateTOTP(secret, code string) (bool, error) {
	valid, err := totp.ValidateCustom(code, secret, time.Now(), totp.ValidateOpts{
		Period:    30,
		Skew:      1,
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA1,
	})
	if err != nil {
		return false, fmt.Errorf("failed to validate TOTP: %w", err)
	}
	return valid, nil
}

// GenerateBackupCodes generates backup codes for MFA
func (s *MFAService) GenerateBackupCodes(count int) ([]string, error) {
	codes := make([]string, count)
	for i := 0; i < count; i++ {
		code := make([]byte, 4)
		if _, err := rand.Read(code); err != nil {
			return nil, fmt.Errorf("failed to generate backup code: %w", err)
		}
		codes[i] = fmt.Sprintf("%08X", code)
	}
	return codes, nil
}

// ValidateBackupCode validates a backup code
func (s *MFAService) ValidateBackupCode(providedCode string, storedCodes []string) (bool, error) {
	for i, storedCode := range storedCodes {
		if providedCode == storedCode {
			// Remove used backup code
			storedCodes = append(storedCodes[:i], storedCodes[i+1:]...)
			return true, nil
		}
	}
	return false, nil
}
