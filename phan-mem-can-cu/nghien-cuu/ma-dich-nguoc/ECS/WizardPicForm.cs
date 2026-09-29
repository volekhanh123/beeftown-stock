using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace ECS;

public class WizardPicForm : Form
{
	private string name;

	private string fromPic;

	private Image toPic;

	private string toPic_String;

	private int maxX;

	private int maxY;

	private int threshold = 128;

	private int width;

	private int height;

	private bool ZoomChecked;

	private IContainer components;

	private SplitContainer splitContainer1;

	private SplitContainer splitContainer2;

	private PictureBox From_PictureBox;

	private RadioButton Custom_RadioButton;

	private RadioButton Zoom_RadioButton;

	private RadioButton OriginalSize_RadioButton;

	private PictureBox To_PictureBox;

	private Label heightLabel;

	private Label widthLabel;

	private RadioButton Threshold_RadioButton;

	private RadioButton Dither_RadioButton;

	private Button Refresh_Button;

	private ComboBox Dither_ComboBox;

	private Panel panel1;

	private TextBox height_TextBox;

	private TextBox width_TextBox;

	private TextBox heightMM_TextBox;

	private TextBox Threshold_TextBox;

	private TextBox widthMM_TextBox;

	private Button Load_Button;

	private Button cancelButton;

	private Button okButton;

	public Image SG_Image
	{
		get
		{
			return toPic;
		}
		set
		{
			toPic = value;
		}
	}

	public string SG_String
	{
		get
		{
			return toPic_String;
		}
		set
		{
			toPic_String = value;
		}
	}

	public string SG_Name
	{
		get
		{
			return name;
		}
		set
		{
			name = value;
		}
	}

	private Image LoadImage(string file)
	{
		Image image = Image.FromFile(file);
		Image result = new Bitmap(image);
		image.Dispose();
		return result;
	}

	private void NewFromPic(string Pic)
	{
		name = Path.GetFileNameWithoutExtension(Pic);
		Text = Program.GetLang("pw_PictureofConfigWizard") + ": " + name;
		fromPic = Pic;
		From_PictureBox.Image = LoadImage(fromPic);
		From_PictureBox.Size = new Size(From_PictureBox.Image.Size.Width + 5, From_PictureBox.Image.Size.Height + 5);
		if (From_PictureBox.Image.Size.Width <= maxX && From_PictureBox.Image.Size.Height <= maxY)
		{
			OriginalSize_RadioButton.Enabled = true;
			OriginalSize_RadioButton.Checked = true;
		}
		else
		{
			OriginalSize_RadioButton.Enabled = false;
			Zoom_RadioButton.Checked = true;
		}
		UpdateBMP();
	}

	public WizardPicForm(string Pic, int X, int Y)
	{
		InitializeComponent();
		maxX = X;
		maxY = Y;
		Threshold_TextBox.Text = threshold.ToString();
		NewFromPic(Pic);
	}

	private void UpdateBMP()
	{
		string fileName = Application.StartupPath + "\\binary\\BitmapConvert.exe";
		string text = Application.StartupPath + "\\WF_Pic.bmp";
		int num = ((!Threshold_RadioButton.Checked) ? (Dither_ComboBox.SelectedIndex + 256) : threshold);
		File.Delete(text);
		string arguments = '"' + fromPic + "\" \"" + text + "\" " + width.ToString() + " " + height.ToString() + " " + num;
		try
		{
			Process process = Process.Start(fileName, arguments);
			Cursor.Current = Cursors.WaitCursor;
			process.WaitForExit();
			Bitmap bitmap = new Bitmap(text);
			new Bitmap(bitmap);
			BitmapData bitmapData = bitmap.LockBits(new Rectangle(Point.Empty, bitmap.Size), ImageLockMode.ReadWrite, PixelFormat.Format1bppIndexed);
			byte[] array = new byte[bitmapData.Stride * bitmapData.Height];
			Marshal.Copy(bitmapData.Scan0, array, 0, array.Length);
			toPic_String = "";
			for (int i = 0; i < bitmapData.Height; i++)
			{
				for (int j = 0; j < (bitmap.Width + 7) / 8; j++)
				{
					Program.getByte_multi((uint)(~array[i * bitmapData.Stride + j]), ref toPic_String, 1);
				}
			}
			int num2 = (toPic_String.Length + 192 + 8191) / 8192;
			Text = string.Format("{0}: {1} ( {2}: {3} )", Program.GetLang("pw_PictureofConfigWizard"), name, Program.GetLang("pw_BlockQuantity"), num2);
			bitmap.UnlockBits(bitmapData);
			bitmap.Dispose();
			To_PictureBox.Image = (toPic = LoadImage(text));
			To_PictureBox.Size = new Size(To_PictureBox.Image.Size.Width + 5, To_PictureBox.Image.Size.Height + 5);
			File.Delete(text);
			Refresh_Button.Visible = false;
		}
		catch
		{
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
	}

	private void Refresh_Button_Click(object sender, EventArgs e)
	{
		UpdateBMP();
	}

	private void WP_MethodChanged_NotIM()
	{
		Refresh_Button.Visible = true;
	}

	private void INT_TextBox_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '.')
		{
			e.Handled = true;
		}
		else if (e.KeyChar != '\b')
		{
			if (e.KeyChar == '\r')
			{
				UpdateBMP();
				e.Handled = true;
			}
			else if (e.KeyChar < '0' || e.KeyChar > '9')
			{
				e.Handled = true;
			}
		}
	}

	private void Threshold_TextBox_TextChanged(object sender, EventArgs e)
	{
		string s = Threshold_TextBox.Text;
		if (!int.TryParse(s, out var result))
		{
			result = 0;
		}
		threshold = result;
		WP_MethodChanged_NotIM();
	}

	private int GetZoomWidth(int height)
	{
		return (int)((double)(height * From_PictureBox.Image.Size.Width / From_PictureBox.Image.Size.Height) + 0.5);
	}

	private int GetZoomHeight(int width)
	{
		return (int)((double)(width * From_PictureBox.Image.Size.Height / From_PictureBox.Image.Size.Width) + 0.5);
	}

	private void width_TextBox_TextChanged(object sender, EventArgs e)
	{
		string s = width_TextBox.Text;
		if (!int.TryParse(s, out var result))
		{
			result = 1;
		}
		if (result > maxX)
		{
			result = maxX;
		}
		if (OriginalSize_RadioButton.Checked && result != From_PictureBox.Image.Width)
		{
			Zoom_RadioButton.Checked = true;
		}
		if (Zoom_RadioButton.Checked && result > GetZoomWidth(maxY))
		{
			result = GetZoomWidth(maxY);
		}
		if (result < 1)
		{
			result = 1;
		}
		width_TextBox.Text = result.ToString();
		widthMM_TextBox.Text = ((decimal)result / 8m).ToString();
		if (Zoom_RadioButton.Checked && !ZoomChecked)
		{
			ZoomChecked = true;
			height_TextBox.Text = GetZoomHeight(result).ToString();
			ZoomChecked = false;
		}
		width = result;
		WP_MethodChanged_NotIM();
	}

	private void height_TextBox_TextChanged(object sender, EventArgs e)
	{
		string s = height_TextBox.Text;
		if (!int.TryParse(s, out var result))
		{
			result = 1;
		}
		if (result > maxY)
		{
			result = maxY;
		}
		if (OriginalSize_RadioButton.Checked && result != From_PictureBox.Image.Height)
		{
			Zoom_RadioButton.Checked = true;
		}
		if (Zoom_RadioButton.Checked && result > GetZoomHeight(maxX))
		{
			result = GetZoomHeight(maxX);
		}
		if (result < 1)
		{
			result = 1;
		}
		height_TextBox.Text = result.ToString();
		heightMM_TextBox.Text = ((decimal)result / 8m).ToString();
		if (Zoom_RadioButton.Checked && !ZoomChecked)
		{
			ZoomChecked = true;
			width_TextBox.Text = GetZoomWidth(result).ToString();
			ZoomChecked = false;
		}
		height = result;
		WP_MethodChanged_NotIM();
	}

	private void OriginalSize_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		width = From_PictureBox.Image.Size.Width;
		height = From_PictureBox.Image.Size.Height;
		width_TextBox.Text = width.ToString();
		height_TextBox.Text = height.ToString();
		UpdateBMP();
	}

	private void Zoom_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		if (From_PictureBox.Image.Size.Width <= maxX && From_PictureBox.Image.Size.Height <= maxY)
		{
			width = From_PictureBox.Image.Size.Width;
			height = From_PictureBox.Image.Size.Height;
		}
		else
		{
			width = Math.Min(maxX, GetZoomWidth(maxY));
			height = Math.Min(maxY, GetZoomHeight(maxX));
		}
		width_TextBox.Text = width.ToString();
		height_TextBox.Text = height.ToString();
		UpdateBMP();
	}

	private void Custom_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		UpdateBMP();
	}

	private void Load_Button_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.CheckFileExists = true;
		openFileDialog.Filter = Program.GetLang("pw_JPEGFile___jpg____jpg_AllFile_________");
		if (openFileDialog.ShowDialog(this) == DialogResult.OK)
		{
			NewFromPic(openFileDialog.FileName);
		}
	}

	private void Dither_ComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		UpdateBMP();
	}

	private void Threshold_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		UpdateBMP();
	}

	private void WizardPicForm_Load(object sender, EventArgs e)
	{
		cancelButton.Text = Program.GetLang("pw_Cancel");
		Custom_RadioButton.Text = Program.GetLang("pw_CustomSize");
		Dither_RadioButton.Text = Program.GetLang("pw_Dither_0_7");
		heightLabel.Text = Program.GetLang("pw_Height_sl_");
		Load_Button.Text = Program.GetLang("pw_Load");
		okButton.Text = Program.GetLang("pw_OK");
		OriginalSize_RadioButton.Text = Program.GetLang("pw_OriginalSize");
		Refresh_Button.Text = Program.GetLang("pw_Refresh");
		Threshold_RadioButton.Text = Program.GetLang("pw_Threshold_0_255");
		widthLabel.Text = Program.GetLang("pw_Width_sl_");
		Zoom_RadioButton.Text = Program.GetLang("pw_Zoom");
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.From_PictureBox = new System.Windows.Forms.PictureBox();
		this.splitContainer2 = new System.Windows.Forms.SplitContainer();
		this.cancelButton = new System.Windows.Forms.Button();
		this.okButton = new System.Windows.Forms.Button();
		this.Load_Button = new System.Windows.Forms.Button();
		this.Refresh_Button = new System.Windows.Forms.Button();
		this.Threshold_TextBox = new System.Windows.Forms.TextBox();
		this.heightMM_TextBox = new System.Windows.Forms.TextBox();
		this.Dither_ComboBox = new System.Windows.Forms.ComboBox();
		this.widthMM_TextBox = new System.Windows.Forms.TextBox();
		this.height_TextBox = new System.Windows.Forms.TextBox();
		this.heightLabel = new System.Windows.Forms.Label();
		this.width_TextBox = new System.Windows.Forms.TextBox();
		this.widthLabel = new System.Windows.Forms.Label();
		this.Dither_RadioButton = new System.Windows.Forms.RadioButton();
		this.Threshold_RadioButton = new System.Windows.Forms.RadioButton();
		this.panel1 = new System.Windows.Forms.Panel();
		this.OriginalSize_RadioButton = new System.Windows.Forms.RadioButton();
		this.Zoom_RadioButton = new System.Windows.Forms.RadioButton();
		this.Custom_RadioButton = new System.Windows.Forms.RadioButton();
		this.To_PictureBox = new System.Windows.Forms.PictureBox();
		System.Windows.Forms.Label label = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label2 = new System.Windows.Forms.Label();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.From_PictureBox).BeginInit();
		this.splitContainer2.Panel1.SuspendLayout();
		this.splitContainer2.Panel2.SuspendLayout();
		this.splitContainer2.SuspendLayout();
		this.panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.To_PictureBox).BeginInit();
		base.SuspendLayout();
		label.AutoSize = true;
		label.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		label.Location = new System.Drawing.Point(355, 21);
		label.Name = "mmLabel1";
		label.Size = new System.Drawing.Size(17, 12);
		label.TabIndex = 19;
		label.Text = "mm";
		label2.AutoSize = true;
		label2.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		label2.Location = new System.Drawing.Point(355, 46);
		label2.Name = "mmLabel2";
		label2.Size = new System.Drawing.Size(17, 12);
		label2.TabIndex = 23;
		label2.Text = "mm";
		this.splitContainer1.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.splitContainer1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer1.Location = new System.Drawing.Point(0, 0);
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.splitContainer1.Panel1.AutoScroll = true;
		this.splitContainer1.Panel1.Controls.Add(this.From_PictureBox);
		this.splitContainer1.Panel2.Controls.Add(this.splitContainer2);
		this.splitContainer1.Size = new System.Drawing.Size(922, 601);
		this.splitContainer1.SplitterDistance = 246;
		this.splitContainer1.TabIndex = 0;
		this.From_PictureBox.Location = new System.Drawing.Point(3, 3);
		this.From_PictureBox.Name = "From_PictureBox";
		this.From_PictureBox.Size = new System.Drawing.Size(227, 130);
		this.From_PictureBox.TabIndex = 0;
		this.From_PictureBox.TabStop = false;
		this.splitContainer2.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.splitContainer2.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer2.Location = new System.Drawing.Point(0, 0);
		this.splitContainer2.Name = "splitContainer2";
		this.splitContainer2.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.splitContainer2.Panel1.Controls.Add(this.cancelButton);
		this.splitContainer2.Panel1.Controls.Add(this.okButton);
		this.splitContainer2.Panel1.Controls.Add(this.Load_Button);
		this.splitContainer2.Panel1.Controls.Add(this.Refresh_Button);
		this.splitContainer2.Panel1.Controls.Add(this.Threshold_TextBox);
		this.splitContainer2.Panel1.Controls.Add(this.heightMM_TextBox);
		this.splitContainer2.Panel1.Controls.Add(this.Dither_ComboBox);
		this.splitContainer2.Panel1.Controls.Add(label);
		this.splitContainer2.Panel1.Controls.Add(this.widthMM_TextBox);
		this.splitContainer2.Panel1.Controls.Add(label2);
		this.splitContainer2.Panel1.Controls.Add(this.height_TextBox);
		this.splitContainer2.Panel1.Controls.Add(this.heightLabel);
		this.splitContainer2.Panel1.Controls.Add(this.width_TextBox);
		this.splitContainer2.Panel1.Controls.Add(this.widthLabel);
		this.splitContainer2.Panel1.Controls.Add(this.Dither_RadioButton);
		this.splitContainer2.Panel1.Controls.Add(this.Threshold_RadioButton);
		this.splitContainer2.Panel1.Controls.Add(this.panel1);
		this.splitContainer2.Panel2.AutoScroll = true;
		this.splitContainer2.Panel2.Controls.Add(this.To_PictureBox);
		this.splitContainer2.Size = new System.Drawing.Size(922, 351);
		this.splitContainer2.SplitterDistance = 78;
		this.splitContainer2.TabIndex = 0;
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.cancelButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.cancelButton.Location = new System.Drawing.Point(788, 12);
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.Size = new System.Drawing.Size(120, 23);
		this.cancelButton.TabIndex = 28;
		this.cancelButton.Text = "cancel";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		this.okButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.okButton.Location = new System.Drawing.Point(788, 42);
		this.okButton.Name = "okButton";
		this.okButton.Size = new System.Drawing.Size(120, 23);
		this.okButton.TabIndex = 27;
		this.okButton.Text = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.Load_Button.Location = new System.Drawing.Point(638, 12);
		this.Load_Button.Name = "Load_Button";
		this.Load_Button.Size = new System.Drawing.Size(120, 23);
		this.Load_Button.TabIndex = 25;
		this.Load_Button.Text = "oLoad";
		this.Load_Button.UseVisualStyleBackColor = true;
		this.Load_Button.Click += new System.EventHandler(Load_Button_Click);
		this.Refresh_Button.Location = new System.Drawing.Point(638, 43);
		this.Refresh_Button.Name = "Refresh_Button";
		this.Refresh_Button.Size = new System.Drawing.Size(120, 23);
		this.Refresh_Button.TabIndex = 25;
		this.Refresh_Button.Text = "oRefresh";
		this.Refresh_Button.UseVisualStyleBackColor = true;
		this.Refresh_Button.Visible = false;
		this.Refresh_Button.Click += new System.EventHandler(Refresh_Button_Click);
		this.Threshold_TextBox.Location = new System.Drawing.Point(548, 15);
		this.Threshold_TextBox.Name = "Threshold_TextBox";
		this.Threshold_TextBox.Size = new System.Drawing.Size(57, 21);
		this.Threshold_TextBox.TabIndex = 26;
		this.Threshold_TextBox.Text = "128";
		this.Threshold_TextBox.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
		this.Threshold_TextBox.TextChanged += new System.EventHandler(Threshold_TextBox_TextChanged);
		this.Threshold_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT_TextBox_KeyPress);
		this.heightMM_TextBox.Enabled = false;
		this.heightMM_TextBox.Location = new System.Drawing.Point(293, 42);
		this.heightMM_TextBox.Name = "heightMM_TextBox";
		this.heightMM_TextBox.Size = new System.Drawing.Size(56, 21);
		this.heightMM_TextBox.TabIndex = 26;
		this.heightMM_TextBox.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
		this.Dither_ComboBox.FormattingEnabled = true;
		this.Dither_ComboBox.Items.AddRange(new object[8] { "0", "1", "2", "3", "4", "5", "6", "7" });
		this.Dither_ComboBox.Location = new System.Drawing.Point(548, 43);
		this.Dither_ComboBox.Name = "Dither_ComboBox";
		this.Dither_ComboBox.Size = new System.Drawing.Size(57, 20);
		this.Dither_ComboBox.TabIndex = 24;
		this.Dither_ComboBox.Text = "0";
		this.Dither_ComboBox.SelectedIndexChanged += new System.EventHandler(Dither_ComboBox_SelectedIndexChanged);
		this.widthMM_TextBox.Enabled = false;
		this.widthMM_TextBox.Location = new System.Drawing.Point(293, 15);
		this.widthMM_TextBox.Name = "widthMM_TextBox";
		this.widthMM_TextBox.Size = new System.Drawing.Size(56, 21);
		this.widthMM_TextBox.TabIndex = 26;
		this.widthMM_TextBox.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
		this.height_TextBox.Location = new System.Drawing.Point(232, 42);
		this.height_TextBox.Name = "height_TextBox";
		this.height_TextBox.Size = new System.Drawing.Size(55, 21);
		this.height_TextBox.TabIndex = 26;
		this.height_TextBox.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
		this.height_TextBox.TextChanged += new System.EventHandler(height_TextBox_TextChanged);
		this.height_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT_TextBox_KeyPress);
		this.heightLabel.AutoSize = true;
		this.heightLabel.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.heightLabel.Location = new System.Drawing.Point(185, 47);
		this.heightLabel.Name = "heightLabel";
		this.heightLabel.Size = new System.Drawing.Size(47, 12);
		this.heightLabel.TabIndex = 20;
		this.heightLabel.Text = "height:";
		this.width_TextBox.Location = new System.Drawing.Point(232, 15);
		this.width_TextBox.Name = "width_TextBox";
		this.width_TextBox.Size = new System.Drawing.Size(55, 21);
		this.width_TextBox.TabIndex = 26;
		this.width_TextBox.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
		this.width_TextBox.TextChanged += new System.EventHandler(width_TextBox_TextChanged);
		this.width_TextBox.KeyPress += new System.Windows.Forms.KeyPressEventHandler(INT_TextBox_KeyPress);
		this.widthLabel.AutoSize = true;
		this.widthLabel.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.widthLabel.Location = new System.Drawing.Point(185, 20);
		this.widthLabel.Name = "widthLabel";
		this.widthLabel.Size = new System.Drawing.Size(41, 12);
		this.widthLabel.TabIndex = 16;
		this.widthLabel.Text = "width:";
		this.Dither_RadioButton.AutoSize = true;
		this.Dither_RadioButton.Checked = true;
		this.Dither_RadioButton.Location = new System.Drawing.Point(405, 45);
		this.Dither_RadioButton.Name = "Dither_RadioButton";
		this.Dither_RadioButton.Size = new System.Drawing.Size(107, 16);
		this.Dither_RadioButton.TabIndex = 0;
		this.Dither_RadioButton.TabStop = true;
		this.Dither_RadioButton.Text = "oDither(0...7)";
		this.Dither_RadioButton.UseVisualStyleBackColor = true;
		this.Threshold_RadioButton.AutoSize = true;
		this.Threshold_RadioButton.Location = new System.Drawing.Point(405, 20);
		this.Threshold_RadioButton.Name = "Threshold_RadioButton";
		this.Threshold_RadioButton.Size = new System.Drawing.Size(137, 16);
		this.Threshold_RadioButton.TabIndex = 0;
		this.Threshold_RadioButton.Text = "oThreshold(0...255)";
		this.Threshold_RadioButton.UseVisualStyleBackColor = true;
		this.Threshold_RadioButton.CheckedChanged += new System.EventHandler(Threshold_RadioButton_CheckedChanged);
		this.panel1.Controls.Add(this.OriginalSize_RadioButton);
		this.panel1.Controls.Add(this.Zoom_RadioButton);
		this.panel1.Controls.Add(this.Custom_RadioButton);
		this.panel1.Location = new System.Drawing.Point(10, 3);
		this.panel1.Name = "panel1";
		this.panel1.Size = new System.Drawing.Size(152, 68);
		this.panel1.TabIndex = 26;
		this.OriginalSize_RadioButton.AutoSize = true;
		this.OriginalSize_RadioButton.Location = new System.Drawing.Point(12, 3);
		this.OriginalSize_RadioButton.Name = "OriginalSize_RadioButton";
		this.OriginalSize_RadioButton.Size = new System.Drawing.Size(107, 16);
		this.OriginalSize_RadioButton.TabIndex = 0;
		this.OriginalSize_RadioButton.TabStop = true;
		this.OriginalSize_RadioButton.Text = "oOriginal Size";
		this.OriginalSize_RadioButton.UseVisualStyleBackColor = true;
		this.OriginalSize_RadioButton.CheckedChanged += new System.EventHandler(OriginalSize_RadioButton_CheckedChanged);
		this.Zoom_RadioButton.AutoSize = true;
		this.Zoom_RadioButton.Location = new System.Drawing.Point(12, 26);
		this.Zoom_RadioButton.Name = "Zoom_RadioButton";
		this.Zoom_RadioButton.Size = new System.Drawing.Size(53, 16);
		this.Zoom_RadioButton.TabIndex = 0;
		this.Zoom_RadioButton.TabStop = true;
		this.Zoom_RadioButton.Text = "oZoom";
		this.Zoom_RadioButton.UseVisualStyleBackColor = true;
		this.Zoom_RadioButton.CheckedChanged += new System.EventHandler(Zoom_RadioButton_CheckedChanged);
		this.Custom_RadioButton.AutoSize = true;
		this.Custom_RadioButton.Location = new System.Drawing.Point(11, 50);
		this.Custom_RadioButton.Name = "Custom_RadioButton";
		this.Custom_RadioButton.Size = new System.Drawing.Size(65, 16);
		this.Custom_RadioButton.TabIndex = 0;
		this.Custom_RadioButton.TabStop = true;
		this.Custom_RadioButton.Text = "oCustom";
		this.Custom_RadioButton.UseVisualStyleBackColor = true;
		this.Custom_RadioButton.CheckedChanged += new System.EventHandler(Custom_RadioButton_CheckedChanged);
		this.To_PictureBox.Location = new System.Drawing.Point(3, 3);
		this.To_PictureBox.Name = "To_PictureBox";
		this.To_PictureBox.Size = new System.Drawing.Size(227, 130);
		this.To_PictureBox.TabIndex = 0;
		this.To_PictureBox.TabStop = false;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.CancelButton = this.cancelButton;
		base.ClientSize = new System.Drawing.Size(922, 601);
		base.Controls.Add(this.splitContainer1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "WizardPicForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
		this.Text = "oPicture of Config Wizard";
		base.Load += new System.EventHandler(WizardPicForm_Load);
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.From_PictureBox).EndInit();
		this.splitContainer2.Panel1.ResumeLayout(false);
		this.splitContainer2.Panel1.PerformLayout();
		this.splitContainer2.Panel2.ResumeLayout(false);
		this.splitContainer2.ResumeLayout(false);
		this.panel1.ResumeLayout(false);
		this.panel1.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.To_PictureBox).EndInit();
		base.ResumeLayout(false);
	}
}
