-- Auto welcome notification when new user registers
CREATE OR REPLACE FUNCTION public.send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, title_en, message, message_en, type, is_global)
  VALUES (
    NEW.id,
    'Chào mừng bạn đến với ZOXI! 🎉',
    'Welcome to ZOXI! 🎉',
    'Cảm ơn bạn đã đăng ký tài khoản ZOXI. Để bắt đầu nhận thanh toán, hãy hoàn thành xác minh KYC và tạo tài khoản ảo (VA) đầu tiên. Nếu cần hỗ trợ, đừng ngại liên hệ với chúng tôi!',
    'Thank you for signing up with ZOXI. To start receiving payments, please complete KYC verification and create your first Virtual Account (VA). If you need any help, don''t hesitate to contact us!',
    'info',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, create new one
DROP TRIGGER IF EXISTS on_new_profile_welcome ON public.profiles;
CREATE TRIGGER on_new_profile_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_notification();
